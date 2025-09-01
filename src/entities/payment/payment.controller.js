import Stripe from 'stripe';
import Booking from '../booking/booking.model.js';
import { Payment } from './payment.model.js';
import { generateResponse } from '../../lib/responseFormate.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe Checkout Session and save necessary payment info
export const payment = async (req, res) => {
  const { booking: bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ success: false, message: 'Booking ID is required.' });
  }

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const total = booking.total;
    const totalPriceInCent = total * 100;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'sgd',
            product_data: {
              name: 'Room Booking',
            },
            unit_amount: totalPriceInCent,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success/${bookingId}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel?bookingId=${bookingId}`,

    });

    
    const newPayment = new Payment({
      booking: booking._id,
      price: total,
      stripeSessionId: session.id,
      paymentIntentId: session.payment_intent,
      status: 'pending',
    });
    await newPayment.save();

    
    booking.stripeSessionId = session.id;
    await booking.save();

    generateResponse(res, 200, true, 'Payment session created successfully', {
      sessionId: session.id,
      paymentIntentId: session.payment_intent,
      url: session.url
    });
  } catch (error) {
  generateResponse(res, 500, false, 'Payment session creation failed', error.message);
  }
};


export const getBookingDetails = async (req, res) => {
  const bookingId = req.params.bookingId || req.query.bookingId;

  if (!bookingId) {
    return generateResponse(res, 400, false, 'Booking ID is required');
  }

  try {
    const booking = await Booking.findById(bookingId)
    .populate('user', 'name email photoURL')         
    .populate('room', 'title maxcapacity')      
    .populate({
      path: 'service',
      select: 'name price  category',
      populate: {
        path: 'category',
        select: 'name description'
      }
    })
    .lean();

    if (!booking) {
      return generateResponse(res, 404, false, 'Booking not found');
    }

    return generateResponse(res, 200, true, 'Booking details fetched successfully', booking);
  } catch (error) {
    console.error('Error fetching booking:', error.message);
    return generateResponse(res, 500, false, 'Internal Server Error', error.message);
  }
};


















// export const updatePaymentStatus = async (req, res) => {
//   const { stripeSessionId } = req.query;

//   if (!stripeSessionId) {
//     return res.status(400).json({ success: false, message: 'stripeSessionId is required.' });
//   }

//   try {
//     const session = await stripe.checkout.sessions.retrieve(stripeSessionId);

//     let paymentStatus = session?.payment_status === 'paid' ? 'paid' : 'failed';

//     // Update Payment record
//     const payment = await Payment.findOneAndUpdate(
//       { stripeSessionId },
//       { status: paymentStatus },
//       { new: true }
//     );

//     if (!payment) {
//       return res.status(404).json({ success: false, message: 'Payment not found.' });
//     }

//     // Update Booking status and payment status
//     const booking = await Booking.findByIdAndUpdate(
//       payment.booking,
//       {
//         status: paymentStatus === 'paid' ? 'confirmed' : 'cancelled',
//         paymentStatus: paymentStatus,
//       },
//       { new: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: `Payment marked as ${paymentStatus}.`,
//       data: {
//         payment,
//         booking,
//       },
//     });
//   } 
//   catch (error) {
//     console.error('Error updating payment status:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update payment status',
//       error: error.message,
//     });
//   }
//};
