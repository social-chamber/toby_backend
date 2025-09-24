import Stripe from 'stripe';
import Booking from '../booking/booking.model.js';
import { Payment } from './payment.model.js';
import { generateResponse } from '../../lib/responseFormate.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe Checkout Session and save necessary payment info
export const payment = async (req, res) => {
  const { booking: bookingId, ...bookingData } = req.body;

  let booking;
  
  try {
    if (bookingId) {
      // Existing booking flow (for admin manual bookings)
      booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }
    } else {
      // New flow: Create booking during payment session creation
      if (!bookingData.user || !bookingData.date || !bookingData.timeSlots || !bookingData.service || !bookingData.room) {
        return res.status(400).json({ success: false, message: 'Booking data is required.' });
      }

      // Import booking service to create booking
      const { createBookingService } = await import('../booking/booking.service.js');
      
      // Create the booking with pending status
      booking = await createBookingService({
        ...bookingData,
        status: 'pending',
        paymentStatus: 'pending'
      });
      
      console.log('✅ Booking created during payment session:', booking._id);
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
      paymentStatus: 'pending',
    });
    await newPayment.save();

    
    booking.stripeSessionId = session.id;
    await booking.save();

    generateResponse(res, 200, true, 'Payment session created successfully', {
      sessionId: session.id,
      paymentIntentId: session.payment_intent,
      url: session.url,
      bookingId: booking._id
    });
  } catch (error) {
  const msg = (error && error.message) ? String(error.message) : 'Payment session creation failed';
  const isClientError = /not found|invalid|required|missing/i.test(msg);
  const statusCode = isClientError ? 400 : 500;
  const message = isClientError ? msg : 'Payment session creation failed';
  generateResponse(res, statusCode, false, message, null);
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
    const msg = (error && error.message) ? String(error.message) : 'Internal Server Error';
    const isClientError = /not found|invalid|required|missing/i.test(msg);
    const statusCode = isClientError ? 404 : 500;
    const message = isClientError ? msg : 'Internal Server Error';
    return generateResponse(res, statusCode, false, message, null);
  }
};










