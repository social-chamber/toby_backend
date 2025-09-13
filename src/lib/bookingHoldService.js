import Booking from '../entities/booking/booking.model.js';
import emailService from './emailService.js';

// Booking hold service to manage temporary holds before payment confirmation
class BookingHoldService {
  constructor() {
    this.holdDurationMinutes = 15; // 15 minutes hold
    this.cleanupIntervalMinutes = 5; // Cleanup every 5 minutes
    this.startCleanupTimer();
  }

  // Create a booking hold
  async createHold(bookingId) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status !== 'pending') {
        throw new Error('Booking is not in pending status');
      }

      // Set hold expiration time
      const holdExpiresAt = new Date(Date.now() + (this.holdDurationMinutes * 60 * 1000));
      
      // Update booking with hold status
      await Booking.findByIdAndUpdate(bookingId, {
        status: 'hold',
        holdExpiresAt: holdExpiresAt,
        holdCreatedAt: new Date()
      });

      console.log(`✅ Booking ${bookingId} placed on hold until ${holdExpiresAt.toISOString()}`);
      
      return {
        success: true,
        bookingId,
        holdExpiresAt,
        holdDurationMinutes: this.holdDurationMinutes
      };
    } catch (error) {
      console.error('Error creating booking hold:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Confirm a booking (move from hold to confirmed)
  async confirmBooking(bookingId, paymentIntentId = null) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status !== 'hold') {
        throw new Error('Booking is not on hold');
      }

      // Check if hold has expired
      if (booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
        throw new Error('Booking hold has expired');
      }

      // Update booking to confirmed status
      await Booking.findByIdAndUpdate(bookingId, {
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentIntentId: paymentIntentId,
        confirmedAt: new Date(),
        holdExpiresAt: null // Clear hold expiration
      });

      console.log(`✅ Booking ${bookingId} confirmed successfully`);
      
      return {
        success: true,
        bookingId,
        confirmedAt: new Date()
      };
    } catch (error) {
      console.error('Error confirming booking:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Release a booking hold (make it available again)
  async releaseHold(bookingId, reason = 'expired') {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status !== 'hold') {
        throw new Error('Booking is not on hold');
      }

      // Update booking back to pending or cancel it
      await Booking.findByIdAndUpdate(bookingId, {
        status: 'cancelled',
        paymentStatus: 'failed',
        holdReleasedAt: new Date(),
        holdReleaseReason: reason,
        holdExpiresAt: null
      });

      console.log(`✅ Booking ${bookingId} hold released (${reason})`);
      
      return {
        success: true,
        bookingId,
        releasedAt: new Date(),
        reason
      };
    } catch (error) {
      console.error('Error releasing booking hold:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Clean up expired holds
  async cleanupExpiredHolds() {
    try {
      const now = new Date();
      
      // Find all bookings on hold that have expired
      const expiredHolds = await Booking.find({
        status: 'hold',
        holdExpiresAt: { $lt: now }
      });

      console.log(`🧹 Found ${expiredHolds.length} expired holds to cleanup`);

      for (const booking of expiredHolds) {
        await this.releaseHold(booking._id, 'expired');
        
        // Send notification email to user about expired hold
        try {
          await emailService.sendEmailWithRetry({
            to: booking.user.email,
            subject: 'Booking Hold Expired - Toby',
            html: this.generateHoldExpiredEmail({
              name: `${booking.user.firstName} ${booking.user.lastName}`,
              bookingId: booking._id,
              date: booking.date,
              timeSlots: booking.timeSlots
            }),
            priority: 'normal'
          });
        } catch (emailError) {
          console.error(`Failed to send hold expired email for booking ${booking._id}:`, emailError);
        }
      }

      return {
        success: true,
        cleanedUp: expiredHolds.length
      };
    } catch (error) {
      console.error('Error cleaning up expired holds:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get hold status for a booking
  async getHoldStatus(bookingId) {
    try {
      const booking = await Booking.findById(bookingId)
        .select('status holdExpiresAt holdCreatedAt paymentStatus')
        .lean();

      if (!booking) {
        throw new Error('Booking not found');
      }

      const now = new Date();
      const isOnHold = booking.status === 'hold';
      const isExpired = booking.holdExpiresAt && booking.holdExpiresAt < now;
      const timeRemaining = booking.holdExpiresAt ? 
        Math.max(0, Math.floor((booking.holdExpiresAt - now) / 1000 / 60)) : 0;

      return {
        bookingId,
        status: booking.status,
        isOnHold,
        isExpired,
        holdExpiresAt: booking.holdExpiresAt,
        holdCreatedAt: booking.holdCreatedAt,
        timeRemainingMinutes: timeRemaining,
        paymentStatus: booking.paymentStatus
      };
    } catch (error) {
      console.error('Error getting hold status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Start cleanup timer
  startCleanupTimer() {
    setInterval(async () => {
      try {
        await this.cleanupExpiredHolds();
      } catch (error) {
        console.error('Error in cleanup timer:', error);
      }
    }, this.cleanupIntervalMinutes * 60 * 1000);

    console.log(`🕐 Started booking hold cleanup timer (every ${this.cleanupIntervalMinutes} minutes)`);
  }

  // Generate hold expired email HTML
  generateHoldExpiredEmail({ name, bookingId, date, timeSlots }) {
    const formatDate = (date) => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Hold Expired</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #fff3cd; padding: 20px; text-align: center; border-radius: 8px; border: 1px solid #ffeaa7; }
          .content { padding: 20px 0; }
          .booking-details { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .cta-button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Booking Hold Expired</h1>
            <p>Your booking hold has expired</p>
          </div>
          
          <div class="content">
            <p>Dear ${name},</p>
            <p>Unfortunately, your booking hold has expired. The time slot you selected is now available for other customers.</p>
            
            <div class="booking-details">
              <h3>Expired Booking Details</h3>
              <p><strong>Booking ID:</strong> ${bookingId}</p>
              <p><strong>Date:</strong> ${formatDate(date)}</p>
              <p><strong>Time Slots:</strong></p>
              <ul>
                ${timeSlots.map(slot => `<li>${slot.start} - ${slot.end}</li>`).join('')}
              </ul>
            </div>
            
            <p>Don't worry! You can still make a new booking for the same or different time slots.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/book" class="cta-button">Make New Booking</a>
            </div>
            
            <p>If you have any questions, please contact us.</p>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing Toby!</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Create singleton instance
const bookingHoldService = new BookingHoldService();

export default bookingHoldService;
