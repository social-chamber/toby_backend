/**
 * Promo Code Usage Notification Service
 * Handles sending notifications to users and admins when promo codes are used
 */

import emailService from './emailService.js';
import { promoCodeUsedUserTemplate, promoCodeUsedAdminTemplate } from './emailTemplates.js';
import PromoCode from '../entities/promo_code/promo_code.model.js';
import Booking from '../entities/booking/booking.model.js';

/**
 * Send promo code usage notifications to user and admin
 * @param {Object} bookingData - Complete booking data with populated fields
 * @param {Object} promoData - Promo code data
 * @param {Object} originalAmount - Original booking amount before discount
 * @param {Object} discountedAmount - Final amount after discount
 * @param {Object} bookingId - Booking ID to update email tracking status
 */
export const sendPromoCodeUsageNotifications = async (bookingData, promoData, originalAmount, discountedAmount, bookingId = null) => {
  try {
    const savings = (originalAmount - discountedAmount).toFixed(2);
    
    // Format date for display
    const formatDate = (date) => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Format time slots for display
    const formatTimeSlots = (timeSlots) => {
      if (!Array.isArray(timeSlots) || timeSlots.length === 0) return 'N/A';
      return timeSlots.map(slot => `${slot.start} - ${slot.end}`).join(', ');
    };

    // Prepare user notification data
    const userNotificationData = {
      name: `${bookingData.user.firstName || ''} ${bookingData.user.lastName || ''}`.trim() || 'Customer',
      email: bookingData.user.email || 'N/A',
      promoCode: promoData.code || 'N/A',
      originalAmount: originalAmount.toFixed(2),
      discountedAmount: discountedAmount.toFixed(2),
      savings: savings,
      bookingId: bookingData._id,
      service: bookingData.service?.name || 'N/A',
      room: bookingData.room?.title || bookingData.room?.name || 'N/A',
      date: formatDate(bookingData.date),
      time: formatTimeSlots(bookingData.timeSlots)
    };

    // Prepare admin notification data
    const adminNotificationData = {
      userName: `${bookingData.user.firstName || ''} ${bookingData.user.lastName || ''}`.trim() || 'N/A',
      userEmail: bookingData.user.email || 'N/A',
      userPhone: bookingData.user.phone || 'N/A',
      promoCode: promoData.code || 'N/A',
      discountType: promoData.discountType || 'N/A',
      discountValue: promoData.discountValue || 'N/A',
      originalAmount: originalAmount.toFixed(2),
      discountedAmount: discountedAmount.toFixed(2),
      savings: savings,
      bookingId: bookingData._id,
      service: bookingData.service?.name || 'N/A',
      room: bookingData.room?.title || bookingData.room?.name || 'N/A',
      date: formatDate(bookingData.date),
      time: formatTimeSlots(bookingData.timeSlots),
      usageCount: promoData.usedCount || 0,
      remainingUses: promoData.usageLimit ? (promoData.usageLimit - promoData.usedCount) : 'Unlimited'
    };

    // Send notifications in parallel
    const [userEmailResult, adminEmailResult] = await Promise.allSettled([
      // Send notification to user
      emailService.sendEmailWithRetry({
        to: bookingData.user.email,
        subject: `🎉 Promo Code Applied - You Saved $${savings}! | Toby`,
        html: promoCodeUsedUserTemplate(userNotificationData),
        priority: 'high'
      }),
      
      // Send notification to admin
      emailService.sendEmailWithRetry({
        to: process.env.ADMIN_EMAIL || 'admin@toby.com', // Configure admin email in environment
        subject: `📊 Promo Code Usage Alert: ${promoData.code} used by ${userNotificationData.name}`,
        html: promoCodeUsedAdminTemplate(adminNotificationData),
        priority: 'normal'
      })
    ]);

    // Log results and update booking with email tracking
    const userNotificationSent = userEmailResult.status === 'fulfilled' && userEmailResult.value.success;
    const adminNotificationSent = adminEmailResult.status === 'fulfilled' && adminEmailResult.value.success;

    if (userNotificationSent) {
      console.log(`✅ Promo code usage notification sent to user: ${bookingData.user.email}`);
    } else {
      console.error(`❌ Failed to send promo code notification to user:`, userEmailResult.reason || userEmailResult.value?.error);
    }

    if (adminNotificationSent) {
      console.log(`✅ Promo code usage notification sent to admin`);
    } else {
      console.error(`❌ Failed to send promo code notification to admin:`, adminEmailResult.reason || adminEmailResult.value?.error);
    }

    // Update booking with promo code email tracking status
    if (bookingId) {
      try {
        const updateData = {
          promoCodeEmailStatus: userNotificationSent ? 'sent' : 'failed',
          promoCodeEmailSentAt: userNotificationSent ? new Date() : null,
          promoCodeEmailMessageId: userNotificationSent ? userEmailResult.value.messageId : null
        };
        
        await Booking.findByIdAndUpdate(bookingId, updateData);
        console.log(`✅ Updated booking ${bookingId} with promo code email tracking status: ${updateData.promoCodeEmailStatus}`);
      } catch (updateError) {
        console.error(`❌ Failed to update booking ${bookingId} with promo code email tracking:`, updateError.message);
      }
    }

    return {
      success: true,
      userNotificationSent,
      adminNotificationSent,
      userEmailResult: userEmailResult.status === 'fulfilled' ? userEmailResult.value : null,
      adminEmailResult: adminEmailResult.status === 'fulfilled' ? adminEmailResult.value : null
    };

  } catch (error) {
    console.error('❌ Error in promo code notification service:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get promo code usage statistics for admin dashboard
 * @param {Object} filters - Optional filters for the query
 * @param {Object} pagination - Pagination options
 */
export const getPromoCodeUsageStats = async (filters = {}, pagination = { page: 1, limit: 10 }) => {
  try {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Build query for bookings with promo codes
    const query = {
      promoCode: { $exists: true, $ne: null },
      status: 'confirmed' // Only confirmed bookings
    };

    // Add date filters if provided
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setUTCHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setUTCHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Add promo code filter if provided
    if (filters.promoCode) {
      const promoCode = await PromoCode.findOne({ code: filters.promoCode });
      if (promoCode) {
        query.promoCode = promoCode._id;
      } else {
        return { bookings: [], totalCount: 0, pagination: { page, limit, totalPages: 0 } };
      }
    }

    // Get bookings with populated data
    const [bookings, totalCount] = await Promise.all([
      Booking.find(query)
        .populate({
            path: 'service',
            populate: {
                path: 'category',
                model: 'Category'
            }
        })
        .populate('room', 'title name')
        .populate('promoCode', 'code discountType discountValue usedCount usageLimit')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query)
    ]);

    // Calculate total savings
    const totalSavings = bookings.reduce((sum, booking) => {
      const promo = booking.promoCode;
      if (!promo) return sum;
      
      const originalAmount = booking.total; // This should be calculated from service price
      let discountAmount = 0;
      
      if (promo.discountType === 'Percentage') {
        discountAmount = originalAmount * (promo.discountValue / 100);
      } else if (promo.discountType === 'Fixed') {
        discountAmount = promo.discountValue;
      }
      
      return sum + discountAmount;
    }, 0);

    // Get unique promo codes used
    const uniquePromoCodes = [...new Set(bookings.map(b => b.promoCode?.code).filter(Boolean))];

    return {
      bookings: bookings.map(booking => ({
        _id: booking._id,
        user: {
          name: `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim(),
          email: booking.user.email,
          phone: booking.user.phone
        },
        promoCode: {
          code: booking.promoCode?.code,
          discountType: booking.promoCode?.discountType,
          discountValue: booking.promoCode?.discountValue,
          usageCount: booking.promoCode?.usedCount,
          usageLimit: booking.promoCode?.usageLimit
        },
        service: booking.service?.name,
        room: booking.room?.title || booking.room?.name,
        date: booking.date,
        timeSlots: booking.timeSlots,
        total: booking.total,
        createdAt: booking.createdAt,
        // Email tracking information
        promoCodeEmailStatus: booking.promoCodeEmailStatus || 'not_sent',
        promoCodeEmailSentAt: booking.promoCodeEmailSentAt,
        promoCodeEmailMessageId: booking.promoCodeEmailMessageId
      })),
      totalCount,
      totalSavings: totalSavings.toFixed(2),
      uniquePromoCodesCount: uniquePromoCodes.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };

  } catch (error) {
    console.error('❌ Error getting promo code usage stats:', error);
    throw error;
  }
};

/**
 * Get detailed promo code usage for a specific promo code
 * @param {string} promoCodeId - Promo code ID
 * @param {Object} pagination - Pagination options
 */
export const getPromoCodeUsageDetails = async (promoCodeId, pagination = { page: 1, limit: 10 }) => {
  try {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [bookings, totalCount, promoCode] = await Promise.all([
      Booking.find({ promoCode: promoCodeId, status: 'confirmed' })
        .populate({
            path: 'service',
            populate: {
                path: 'category',
                model: 'Category'
            }
        })
        .populate('room', 'title name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments({ promoCode: promoCodeId, status: 'confirmed' }),
      PromoCode.findById(promoCodeId)
    ]);

    if (!promoCode) {
      throw new Error('Promo code not found');
    }

    return {
      promoCode: {
        _id: promoCode._id,
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        usedCount: promoCode.usedCount,
        usageLimit: promoCode.usageLimit,
        expiryDate: promoCode.expiryDate,
        active: promoCode.active
      },
      usageDetails: bookings.map(booking => ({
        _id: booking._id,
        user: {
          name: `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim(),
          email: booking.user.email,
          phone: booking.user.phone
        },
        service: booking.service?.name,
        room: booking.room?.title || booking.room?.name,
        date: booking.date,
        timeSlots: booking.timeSlots,
        total: booking.total,
        createdAt: booking.createdAt
      })),
      totalCount,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };

  } catch (error) {
    console.error('❌ Error getting promo code usage details:', error);
    throw error;
  }
};
