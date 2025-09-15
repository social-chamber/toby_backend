/**
 * Booking Status Notification Service
 * Handles sending email notifications for booking status changes
 */

import emailService from './emailService.js';
import { 
  bookingConfirmedTemplate, 
  bookingCancelledTemplate, 
  bookingRefundedTemplate 
} from './emailTemplates.js';

/**
 * Send booking confirmation notification
 * @param {Object} booking - Booking object with populated data
 * @param {Object} promoData - Promo code data (if applicable)
 * @param {Number} originalAmount - Original amount before discount
 */
export const sendBookingConfirmedNotification = async (booking, promoData = null, originalAmount = null) => {
  try {
    const formatDate = (date) => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const formatTimeSlots = (slots) => {
      if (!Array.isArray(slots) || slots.length === 0) return 'N/A';
      return slots.map(slot => `${slot.start} - ${slot.end}`).join(', ');
    };

    // Calculate savings if promo code was used
    let savings = 'N/A';
    let promoCode = null;
    if (promoData && originalAmount) {
      savings = (originalAmount - booking.total).toFixed(2);
      promoCode = promoData.code;
    }

    const emailData = {
      name: `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() || 'Customer',
      email: booking.user.email || 'N/A',
      category: booking?.service?.category?.name || 'N/A',
      room: booking?.room?.title || booking?.room?.name || 'N/A',
      service: booking?.service?.name || 'N/A',
      time: formatTimeSlots(booking.timeSlots),
      bookingId: booking._id,
      date: formatDate(booking.date),
      total: booking.total?.toFixed(2) || 'N/A',
      promoCode: promoCode,
      originalAmount: originalAmount?.toFixed(2) || 'N/A',
      savings: savings
    };

    const emailHtml = bookingConfirmedTemplate(emailData);
    
    await emailService.sendEmailWithRetry({
      to: booking.user.email,
      subject: `✅ Booking Confirmed - ${promoCode ? `Promo Code ${promoCode} Applied!` : 'Payment Successful'}`,
      html: emailHtml,
      priority: 'high'
    });

    console.log(`✅ Booking confirmation notification sent to ${booking.user.email} for booking ${booking._id}`);
    return { success: true, messageId: 'sent' };

  } catch (error) {
    console.error(`❌ Failed to send booking confirmation notification to ${booking.user.email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send booking cancellation notification
 * @param {Object} booking - Booking object with populated data
 * @param {String} reason - Cancellation reason (optional)
 */
export const sendBookingCancelledNotification = async (booking, reason = 'N/A') => {
  try {
    const formatDate = (date) => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const formatTimeSlots = (slots) => {
      if (!Array.isArray(slots) || slots.length === 0) return 'N/A';
      return slots.map(slot => `${slot.start} - ${slot.end}`).join(', ');
    };

    const emailData = {
      name: `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() || 'Customer',
      email: booking.user.email || 'N/A',
      category: booking?.service?.category?.name || 'N/A',
      room: booking?.room?.title || booking?.room?.name || 'N/A',
      service: booking?.service?.name || 'N/A',
      time: formatTimeSlots(booking.timeSlots),
      bookingId: booking._id,
      date: formatDate(booking.date),
      total: booking.total?.toFixed(2) || 'N/A',
      promoCode: booking.promoCode?.code || null,
      reason: reason
    };

    const emailHtml = bookingCancelledTemplate(emailData);
    
    await emailService.sendEmailWithRetry({
      to: booking.user.email,
      subject: `❌ Booking Cancelled - ${booking._id}`,
      html: emailHtml,
      priority: 'high'
    });

    console.log(`✅ Booking cancellation notification sent to ${booking.user.email} for booking ${booking._id}`);
    return { success: true, messageId: 'sent' };

  } catch (error) {
    console.error(`❌ Failed to send booking cancellation notification to ${booking.user.email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send booking refund notification
 * @param {Object} booking - Booking object with populated data
 * @param {Number} refundAmount - Amount refunded
 * @param {String} refundId - Refund transaction ID
 */
export const sendBookingRefundedNotification = async (booking, refundAmount, refundId) => {
  try {
    const formatDate = (date) => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const formatTimeSlots = (slots) => {
      if (!Array.isArray(slots) || slots.length === 0) return 'N/A';
      return slots.map(slot => `${slot.start} - ${slot.end}`).join(', ');
    };

    const emailData = {
      name: `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() || 'Customer',
      email: booking.user.email || 'N/A',
      category: booking?.service?.category?.name || 'N/A',
      room: booking?.room?.title || booking?.room?.name || 'N/A',
      service: booking?.service?.name || 'N/A',
      time: formatTimeSlots(booking.timeSlots),
      bookingId: booking._id,
      date: formatDate(booking.date),
      total: booking.total?.toFixed(2) || 'N/A',
      promoCode: booking.promoCode?.code || null,
      refundAmount: refundAmount?.toFixed(2) || 'N/A',
      refundId: refundId || 'N/A'
    };

    const emailHtml = bookingRefundedTemplate(emailData);
    
    await emailService.sendEmailWithRetry({
      to: booking.user.email,
      subject: `💰 Refund Processed - ${booking._id}`,
      html: emailHtml,
      priority: 'high'
    });

    console.log(`✅ Booking refund notification sent to ${booking.user.email} for booking ${booking._id}`);
    return { success: true, messageId: 'sent' };

  } catch (error) {
    console.error(`❌ Failed to send booking refund notification to ${booking.user.email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send comprehensive booking status update notification
 * @param {Object} booking - Booking object with populated data
 * @param {String} status - New booking status
 * @param {Object} options - Additional options (reason, refundAmount, refundId, etc.)
 */
export const sendBookingStatusUpdateNotification = async (booking, status, options = {}) => {
  try {
    // Populate booking data if not already populated
    if (!booking.service?.category || !booking.room) {
      const Booking = (await import('../entities/booking/booking.model.js')).default;
      const populatedBooking = await Booking.findById(booking._id)
        .populate({
          path: 'service',
          populate: {
            path: 'category',
            model: 'Category'
          }
        })
        .populate('room')
        .populate('promoCode');
      
      if (!populatedBooking) {
        throw new Error('Booking not found');
      }
      booking = populatedBooking;
    }

    switch (status) {
      case 'confirmed':
        return await sendBookingConfirmedNotification(
          booking, 
          options.promoData, 
          options.originalAmount
        );
      
      case 'cancelled':
        return await sendBookingCancelledNotification(
          booking, 
          options.reason
        );
      
      case 'refunded':
        return await sendBookingRefundedNotification(
          booking, 
          options.refundAmount, 
          options.refundId
        );
      
      default:
        console.warn(`Unknown booking status: ${status}`);
        return { success: false, error: `Unknown status: ${status}` };
    }

  } catch (error) {
    console.error(`❌ Failed to send booking status update notification:`, error.message);
    return { success: false, error: error.message };
  }
};
