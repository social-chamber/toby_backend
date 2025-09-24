import Stripe from 'stripe';
import Booking from '../booking/booking.model.js';
import { Payment } from './payment.model.js';
import emailService from '../../lib/emailService.js';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  console.log('🔔 Stripe webhook received:', req.headers['stripe-signature'] ? 'Signature present' : 'No signature');
  
  if (!sig) {
    console.error('❌ No Stripe signature found in headers.');
    return res.status(400).send('Webhook Error: No signature found');
  }

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('✅ Webhook signature verified. Event type:', event.type);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {

    case 'checkout.session.completed': {
      console.log('💳 Processing checkout.session.completed event');
      
      const session = event.data.object;
      console.log('📋 Session ID:', session.id);
      console.log('💰 Payment Intent:', session.payment_intent);

      const payment = await Payment.findOneAndUpdate(
        { stripeSessionId: session.id },
        {
          paymentStatus: 'paid',
          paymentIntentId: session.payment_intent,
        },
        { new: true }
      );

      if (!payment) {
        console.warn('❌ Payment not found for session:', session.id);
        break;
      }
      console.log('✅ Payment found and updated:', payment._id);

      const booking = await Booking.findByIdAndUpdate(
        payment.booking,
        {
          status: 'confirmed', // Confirm booking after successful payment
          paymentStatus: 'paid',
          confirmedAt: new Date()
        },
        { new: true }
      )
      .populate('room')
      .populate({
        path: 'service',
        populate: {
          path: 'category'
        }
      })

      if (!booking) {
        console.warn('❌ Booking not found for payment:', payment._id);
        break;
      }
      console.log('✅ Booking confirmed:', booking._id, 'Status:', booking.status);

      // Increment promo code usage count when payment is completed
      if (booking.promoCode) {
        try {
          const { incrementPromoUsageService } = await import('../promo_code/promo_code.service.js');
          await incrementPromoUsageService(booking.promoCode);
          console.log(`✅ Promo code usage incremented for booking ${booking._id}`);

        // Note: Promo code notification is now included in the booking confirmation email above
        // No need for separate promo code notification email
        } catch (error) {
          console.error(`❌ Failed to increment promo usage for booking ${booking._id}:`, error.message);
        }
      }

    
    const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };


      // Import payment success template
      const { paymentSuccessTemplate } = await import('../../lib/emailTemplates.js');
      
      // Format time slots for email display
      const formatTimeSlots = (slots) => {
        if (!Array.isArray(slots) || slots.length === 0) return 'N/A';
        return slots.map(slot => `${slot.start} - ${slot.end}`).join(', ');
      };

      // Prepare email payload
      const emailHtml = paymentSuccessTemplate({
        name: `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() || 'Customer',
        email: booking.user.email || '',
        category: booking?.service?.category?.name || 'N/A',
        room: booking?.room?.title || booking?.room?.name || 'N/A',
        service: booking?.service?.name || 'N/A',
        time: formatTimeSlots(booking.timeSlots),
        bookingId: booking._id,
        date: formatDate(booking.date)
      });

      // Send confirmation email with retry logic
      const emailResult = await emailService.sendEmailWithRetry({
        to: booking.user.email,
        subject: 'Booking Confirmed - Payment Successful | Toby',
        html: emailHtml,
        priority: 'high'
      });

      // Update promo code email tracking status if promo code was used
      if (booking.promoCode && emailResult.success) {
        try {
          await Booking.findByIdAndUpdate(booking._id, {
            promoCodeEmailStatus: 'sent',
            promoCodeEmailSentAt: new Date(),
            promoCodeEmailMessageId: emailResult.messageId
          });
          console.log(`✅ Updated booking ${booking._id} with promo code email tracking status: sent`);
        } catch (updateError) {
          console.error(`❌ Failed to update booking ${booking._id} with promo code email tracking:`, updateError.message);
        }
      }

      // Note: Booking status notification is now included in the booking confirmation email above
      // No need for separate booking status notification email
      
      if (emailResult.success) {
        // Update booking with email confirmation details
        await Booking.findByIdAndUpdate(booking._id, {
          confirmationEmailSentAt: new Date(),
          confirmationEmailMessageId: emailResult.messageId
        });
        console.log(`✅ Confirmation email sent for booking ${booking._id}`);
      } else {
        console.error(`❌ Failed to send confirmation email for booking ${booking._id}:`, emailResult.error);
      }

      break;
    }

    case 'payment_intent.payment_failed': {
      console.log('Payment failed event received:', event.id);
      
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      // Find the booking associated with this payment
      const payment = await Payment.findOne({ paymentIntentId });
      if (!payment) {
        console.warn('Payment not found for failed intent:', paymentIntentId);
        break;
      }

      // Update payment status
      await Payment.findByIdAndUpdate(payment._id, { 
        paymentStatus: 'failed' 
      });

      // Update booking status
      const booking = await Booking.findByIdAndUpdate(
        payment.booking,
        { 
          status: 'cancelled',
          paymentStatus: 'failed',
          cancelledAt: new Date()
        },
        { new: true }
      ).populate({
          path: 'service',
          populate: {
              path: 'category',
              model: 'Category'
          }
      }).populate('room');

      if (!booking) {
        console.warn('Booking not found for payment:', payment._id);
        break;
      }

      // Send payment failed email
      try {
        const formatDate = (date) => {
          const d = new Date(date);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        };

        const { paymentFailedTemplate } = await import('../../lib/emailTemplates.js');

        // Format time slots for email display
        const formatTimeSlots = (slots) => {
          if (!Array.isArray(slots) || slots.length === 0) return 'N/A';
          return slots.map(slot => `${slot.start} - ${slot.end}`).join(', ');
        };

        const emailHtml = paymentFailedTemplate({
          name: `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() || 'Customer',
          email: booking.user.email || '',
          category: booking?.service?.category?.name || 'N/A',
          room: booking?.room?.title || booking?.room?.name || 'N/A',
          service: booking?.service?.name || 'N/A',
          time: formatTimeSlots(booking.timeSlots),
          bookingId: booking._id,
          date: formatDate(booking.date)
        });

        const emailResult = await emailService.sendEmailWithRetry({
          to: booking.user.email,
          subject: 'Payment Failed - Booking Cancelled | Toby',
          html: emailHtml,
          priority: 'high'
        });

        if (emailResult.success) {
          await Booking.findByIdAndUpdate(booking._id, {
            paymentFailedEmailSentAt: new Date(),
            paymentFailedEmailMessageId: emailResult.messageId
          });
          console.log(`✅ Payment failed email sent for booking ${booking._id}`);
        } else {
          console.error(`❌ Failed to send payment failed email for booking ${booking._id}:`, emailResult.error);
        }
      } catch (error) {
        console.error('❌ Error sending payment failed email:', error.message);
      }

      break;
    }

      case 'charge.refunded':
      case 'refund.updated':
      case 'refund.succeeded': {
          const object = event.data.object;
          const paymentIntentId = object.payment_intent;
  
          if (!paymentIntentId) {
            console.warn(`No paymentIntentId in event: ${event.type}`);
            break;
          }
  
          const payment = await Payment.findOneAndUpdate(
            { paymentIntentId },
            { paymentStatus: 'refunded' },
            { new: true }
          );
  
          if (!payment) {
            console.warn('Refunded payment not found for intent:', paymentIntentId);
            break;
          }
  
          await Booking.findByIdAndUpdate(
            payment.booking,
            {
              status: 'refunded',
              paymentStatus: 'refunded',
            },
            { new: true }
          );
  
          console.log(`Booking ${payment.booking} refunded via ${event.type}`);
          break;
        }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error in webhook processing:', err);
    res.status(500).send('Webhook handler error');
  }
};





















