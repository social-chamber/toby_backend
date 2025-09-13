import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from '../src/entities/booking/booking.model.js';
import emailService from '../src/lib/emailService.js';
import bookingConfirmationTemplate from '../src/lib/payment_success_template.js';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Format date helper
const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Find bookings that are paid but missing confirmation emails
const findMissingConfirmations = async () => {
  try {
    console.log('🔍 Searching for bookings missing confirmation emails...');
    
    const missingConfirmations = await Booking.find({
      paymentStatus: "paid",
      status: "confirmed",
      // Look for bookings without confirmation_email_sent_at field
      confirmationEmailSentAt: { $exists: false }
    })
    .populate('room')
    .populate({
      path: 'service',
      populate: {
        path: 'category'
      }
    })
    .sort({ createdAt: -1 });

    console.log(`📊 Found ${missingConfirmations.length} bookings missing confirmation emails`);
    
    return missingConfirmations;
  } catch (error) {
    console.error('❌ Error finding missing confirmations:', error);
    throw error;
  }
};

// Send confirmation email for a booking
const sendConfirmationEmail = async (booking) => {
  try {
    console.log(`📧 Sending confirmation email for booking ${booking._id} to ${booking.user.email}`);
    
    const emailHtml = bookingConfirmationTemplate({
      name: `${booking.user.firstName} ${booking.user.lastName}`,
      email: booking.user.email,
      category: booking?.service?.category?.name || 'N/A',
      room: booking?.room?.title || 'N/A',
      service: booking?.service?.name || 'N/A',
      time: booking.timeSlots,
      bookingId: booking._id,
      date: formatDate(booking.date)
    });

    const result = await emailService.sendEmailWithRetry({
      to: booking.user.email,
      subject: 'Your Booking Confirmation - Toby',
      html: emailHtml,
      priority: 'high'
    });

    if (result.success) {
      // Update booking to mark confirmation email as sent
      await Booking.findByIdAndUpdate(booking._id, {
        confirmationEmailSentAt: new Date(),
        confirmationEmailMessageId: result.messageId
      });
      
      console.log(`✅ Confirmation email sent successfully for booking ${booking._id}`);
      return { success: true, bookingId: booking._id, email: booking.user.email };
    } else {
      console.error(`❌ Failed to send confirmation email for booking ${booking._id}:`, result.error);
      return { success: false, bookingId: booking._id, error: result.error };
    }
  } catch (error) {
    console.error(`❌ Error sending confirmation email for booking ${booking._id}:`, error);
    return { success: false, bookingId: booking._id, error: error.message };
  }
};

// Process all missing confirmations
const processMissingConfirmations = async () => {
  try {
    await connectDB();
    
    const missingConfirmations = await findMissingConfirmations();
    
    if (missingConfirmations.length === 0) {
      console.log('🎉 No missing confirmation emails found!');
      return;
    }

    console.log(`\n🚀 Processing ${missingConfirmations.length} missing confirmation emails...\n`);
    
    const results = {
      successful: [],
      failed: []
    };

    // Process each booking
    for (let i = 0; i < missingConfirmations.length; i++) {
      const booking = missingConfirmations[i];
      console.log(`\n📋 Processing booking ${i + 1}/${missingConfirmations.length}: ${booking._id}`);
      
      const result = await sendConfirmationEmail(booking);
      
      if (result.success) {
        results.successful.push(result);
      } else {
        results.failed.push(result);
      }
      
      // Add a small delay between emails to avoid rate limiting
      if (i < missingConfirmations.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Print summary
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Successfully sent: ${results.successful.length} emails`);
    console.log(`❌ Failed to send: ${results.failed.length} emails`);
    
    if (results.failed.length > 0) {
      console.log('\n❌ Failed bookings:');
      results.failed.forEach(failed => {
        console.log(`  - Booking ${failed.bookingId}: ${failed.error}`);
      });
    }

    if (results.successful.length > 0) {
      console.log('\n✅ Successfully processed bookings:');
      results.successful.forEach(success => {
        console.log(`  - Booking ${success.bookingId} → ${success.email}`);
      });
    }

  } catch (error) {
    console.error('❌ Error processing missing confirmations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  processMissingConfirmations();
}

export { findMissingConfirmations, sendConfirmationEmail, processMissingConfirmations };
