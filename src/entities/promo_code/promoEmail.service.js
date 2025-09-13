import PromoEmail from './promoEmail.model.js';
import PromoCode from './promo_code.model.js';
import emailService from '../../lib/emailService.js';
import Booking from '../booking/booking.model.js';

export const createPromoEmailCampaign = async (data) => {
  const { promoCodeId, subject, body, recipients, sentBy } = data;
  
  // Validate promo code exists
  const promoCode = await PromoCode.findById(promoCodeId);
  if (!promoCode) {
    throw new Error('Promo code not found');
  }
  
  // Get recipients if not provided
  let targetEmails = recipients;
  if (!targetEmails || targetEmails.length === 0) {
    const distinctEmails = await Booking.distinct('user.email');
    targetEmails = distinctEmails.filter(Boolean);
  }
  
  if (targetEmails.length === 0) {
    throw new Error('No recipients found');
  }
  
  // Create promo email campaign
  const promoEmail = new PromoEmail({
    promoCode: promoCodeId,
    subject,
    body,
    recipients: targetEmails.map(email => ({
      email,
      status: 'pending'
    })),
    totalRecipients: targetEmails.length,
    sentBy,
    status: 'pending'
  });
  
  return await promoEmail.save();
};

export const sendPromoEmailCampaign = async (campaignId) => {
  const campaign = await PromoEmail.findById(campaignId)
    .populate('promoCode')
    .populate('sentBy', 'firstName lastName email');
  
  if (!campaign) {
    throw new Error('Email campaign not found');
  }
  
  if (campaign.status !== 'pending') {
    throw new Error('Campaign has already been processed');
  }
  
  // Update status to processing
  campaign.status = 'processing';
  await campaign.save();
  
  const results = {
    successful: [],
    failed: [],
    total: campaign.totalRecipients
  };
  
  // Send emails with retry logic
  for (const recipient of campaign.recipients) {
    if (recipient.status !== 'pending') continue;
    
    try {
      const emailHtml = generatePromoEmailHTML({
        subject: campaign.subject,
        body: campaign.body,
        promoCode: campaign.promoCode.code,
        recipientEmail: recipient.email
      });
      
      const emailResult = await emailService.sendEmailWithRetry({
        to: recipient.email,
        subject: campaign.subject,
        html: emailHtml,
        priority: 'normal'
      });
      
      if (emailResult.success) {
        campaign.updateRecipientStatus(
          recipient.email, 
          'sent', 
          emailResult.messageId
        );
        results.successful.push({
          email: recipient.email,
          messageId: emailResult.messageId
        });
      } else {
        campaign.updateRecipientStatus(
          recipient.email, 
          'failed', 
          null, 
          emailResult.error
        );
        results.failed.push({
          email: recipient.email,
          error: emailResult.error
        });
      }
      
      // Save progress after each email
      await campaign.save();
      
      // Small delay to avoid overwhelming SMTP server
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Failed to send email to ${recipient.email}:`, error);
      campaign.updateRecipientStatus(
        recipient.email, 
        'failed', 
        null, 
        error.message
      );
      results.failed.push({
        email: recipient.email,
        error: error.message
      });
      await campaign.save();
    }
  }
  
  // Final status update
  campaign.completedAt = new Date();
  await campaign.save();
  
  return {
    campaign,
    results
  };
};

export const retryFailedEmails = async (campaignId, maxRetries = 3) => {
  const campaign = await PromoEmail.findById(campaignId);
  
  if (!campaign) {
    throw new Error('Email campaign not found');
  }
  
  const failedRecipients = campaign.recipients.filter(
    r => r.status === 'failed' && r.retryCount < maxRetries
  );
  
  if (failedRecipients.length === 0) {
    return { message: 'No failed emails to retry', retried: 0 };
  }
  
  const results = {
    successful: [],
    failed: [],
    retried: failedRecipients.length
  };
  
  for (const recipient of failedRecipients) {
    try {
      const emailHtml = generatePromoEmailHTML({
        subject: campaign.subject,
        body: campaign.body,
        promoCode: campaign.promoCode.code,
        recipientEmail: recipient.email
      });
      
      const emailResult = await emailService.sendEmailWithRetry({
        to: recipient.email,
        subject: campaign.subject,
        html: emailHtml,
        priority: 'normal'
      });
      
      if (emailResult.success) {
        campaign.updateRecipientStatus(
          recipient.email, 
          'sent', 
          emailResult.messageId
        );
        results.successful.push({
          email: recipient.email,
          messageId: emailResult.messageId
        });
      } else {
        campaign.updateRecipientStatus(
          recipient.email, 
          'failed', 
          null, 
          emailResult.error
        );
        results.failed.push({
          email: recipient.email,
          error: emailResult.error
        });
      }
      
      await campaign.save();
      
    } catch (error) {
      console.error(`Retry failed for ${recipient.email}:`, error);
      campaign.updateRecipientStatus(
        recipient.email, 
        'failed', 
        null, 
        error.message
      );
      results.failed.push({
        email: recipient.email,
        error: error.message
      });
      await campaign.save();
    }
  }
  
  return results;
};

export const getPromoEmailCampaigns = async (filter = {}, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  const [campaigns, total] = await Promise.all([
    PromoEmail.find(filter)
      .populate('promoCode', 'code discountType discountValue')
      .populate('sentBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    PromoEmail.countDocuments(filter)
  ]);
  
  return { campaigns, total };
};

export const getPromoEmailStats = async (promoCodeId = null) => {
  const matchStage = promoCodeId ? { promoCode: promoCodeId } : {};
  
  const stats = await PromoEmail.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalCampaigns: { $sum: 1 },
        totalRecipients: { $sum: '$totalRecipients' },
        totalSent: { $sum: '$sentCount' },
        totalFailed: { $sum: '$failedCount' },
        avgSuccessRate: { $avg: '$successRate' }
      }
    }
  ]);
  
  return stats[0] || {
    totalCampaigns: 0,
    totalRecipients: 0,
    totalSent: 0,
    totalFailed: 0,
    avgSuccessRate: 0
  };
};

// Generate HTML for promo emails
const generatePromoEmailHTML = ({ subject, body, promoCode, recipientEmail }) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background-color: #f8f9fa; 
          padding: 20px; 
          text-align: center; 
          border-radius: 8px; 
          margin-bottom: 20px;
        }
        .content { 
          padding: 20px 0; 
        }
        .promo-code { 
          background-color: #fff3cd; 
          border: 2px solid #ffeaa7; 
          padding: 15px; 
          text-align: center; 
          border-radius: 8px; 
          margin: 20px 0; 
        }
        .promo-code h2 { 
          color: #856404; 
          margin: 0 0 10px 0; 
        }
        .code { 
          font-size: 24px; 
          font-weight: bold; 
          color: #856404; 
          letter-spacing: 2px; 
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          color: #666; 
          font-size: 14px; 
          border-top: 1px solid #eee; 
          margin-top: 20px; 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Special Offer!</h1>
        <p>Exclusive promo code for you</p>
      </div>
      
      <div class="content">
        <p>Hello,</p>
        <p>${body}</p>
        
        <div class="promo-code">
          <h2>Your Promo Code</h2>
          <div class="code">${promoCode}</div>
          <p style="margin: 10px 0 0 0; color: #856404;">
            Use this code at checkout to get your discount!
          </p>
        </div>
        
        <p>Thank you for being a valued customer!</p>
      </div>
      
      <div class="footer">
        <p>This email was sent to ${recipientEmail}</p>
        <p>If you no longer wish to receive these emails, please contact us.</p>
        <p>© Toby Booking System</p>
      </div>
    </body>
    </html>
  `;
};
