import Stripe from 'stripe';
import Booking from '../booking/booking.model.js';
import { Payment } from './payment.model.js';
import emailService from '../../lib/emailService.js';
import { bookingConfirmedTemplate } from '../../lib/emailTemplates.js';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  if (!sig) {
    console.error('No Stripe signature found in headers.');
    return res.status(400).send('Webhook Error: No signature found');
  }

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {

    case 'checkout.session.completed': {
      
      const session = event.data.object;

      const payment = await Payment.findOneAndUpdate(
        { stripeSessionId: session.id },
        {
          paymentStatus: 'paid',
          paymentIntentId: session.payment_intent,
        },
        { new: true }
      );

      if (!payment) {
        console.warn('Payment not found for session:', session.id);
        break;
      }

      const booking = await Booking.findByIdAndUpdate(
        payment.booking,
        {
          status: 'confirmed',
          paymentStatus: 'paid',
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
        console.warn('Booking not found for payment:', payment._id);
        break;
      }

      // Increment promo code usage count when payment is completed
      if (booking.promoCode) {
        try {
          const { incrementPromoUsageService } = await import('../promo_code/promo_code.service.js');
          const updatedPromo = await incrementPromoUsageService(booking.promoCode);
          console.log(`✅ Promo code usage incremented for booking ${booking._id}`);

          // Send promo code usage notifications
          try {
            const { sendPromoCodeUsageNotifications } = await import('../../lib/promoCodeNotificationService.js');
            
            // Calculate original amount (before discount)
            const service = booking.service;
            const pricePerSlot = (service.pricePerSlot || 0) + 1; // Add $1 to match frontend display
            const originalAmount = pricePerSlot * booking.timeSlots.length * booking.user.numberOfPeople;
            
            await sendPromoCodeUsageNotifications(booking, updatedPromo, originalAmount, booking.total, booking._id);
            console.log(`✅ Promo code usage notifications sent for booking ${booking._id}`);
          } catch (notificationError) {
            console.error(`❌ Failed to send promo code notifications for booking ${booking._id}:`, notificationError.message);
          }
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

      // Send comprehensive booking status notification
      try {
        const { sendBookingStatusUpdateNotification } = await import('../../lib/bookingStatusNotificationService.js');
        
        // Calculate original amount for promo code savings display
        let originalAmount = null;
        if (booking.promoCode) {
          const service = booking.service;
          const pricePerSlot = (service.pricePerSlot || 0) + 1; // Add $1 to match frontend display
          originalAmount = pricePerSlot * booking.timeSlots.length * booking.user.numberOfPeople;
        }
        
        await sendBookingStatusUpdateNotification(booking, 'confirmed', {
          promoData: booking.promoCode,
          originalAmount: originalAmount
        });
        console.log(`✅ Booking status notification sent for booking ${booking._id}`);
      } catch (notificationError) {
        console.error(`❌ Failed to send booking status notification for booking ${booking._id}:`, notificationError.message);
      }
      
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
          paymentStatus: 'failed'
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






















      // case 'checkout.session.completed': {
      //   const session = event.data.object;


      //   // Update Payment status
      //   const payment = await Payment.findOneAndUpdate(
      //       { stripeSessionId: session.id },
      //       {
      //         paymentStatus: 'paid',
      //         paymentIntentId: session.payment_intent,
      //       },
      //     { new: true }
      //   );

      //   // console.log("Payment found:", payment);

      //   if (!payment) {
      //     console.warn('Payment not found for session:', session.id);
      //     break;
      //   }

      //   // Update Booking status
      //   await Booking.findByIdAndUpdate(
      //     payment.booking,
      //     {
      //       status: 'confirmed',
      //       paymentStatus: 'paid',
      //     },
          
      //     { new: true }
      //   );

      //   // console.log(`Booking ${payment.booking} confirmed via webhook`);
      //   break;
      // }