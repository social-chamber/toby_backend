import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { processMissingConfirmations } from './fix-missing-confirmations.js';
import { fixTimezoneQueries } from './fix-timezone-queries.js';
import { fixPromoCounts } from './fix-promo-counts.js';

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

// Main function to run all fixes
const runAllFixes = async () => {
  try {
    console.log('🚀 Starting comprehensive system fixes...\n');
    
    await connectDB();
    
    // 1. Fix missing confirmation emails
    console.log('📧 STEP 1: Fixing missing confirmation emails...');
    console.log('=' .repeat(50));
    await processMissingConfirmations();
    console.log('\n');
    
    // 2. Analyze timezone issues
    console.log('🕐 STEP 2: Analyzing timezone issues...');
    console.log('=' .repeat(50));
    await fixTimezoneQueries();
    console.log('\n');
    
    // 3. Fix promo code counts
    console.log('🎫 STEP 3: Fixing promo code usage counts...');
    console.log('=' .repeat(50));
    await fixPromoCounts();
    console.log('\n');
    
    // 4. System health check
    console.log('🏥 STEP 4: System health check...');
    console.log('=' .repeat(50));
    await performHealthCheck();
    console.log('\n');
    
    console.log('🎉 All fixes completed successfully!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Update your email service configuration (consider switching to SendGrid/Postmark)');
    console.log('2. Test the new booking hold/confirmation flow');
    console.log('3. Monitor email delivery rates');
    console.log('4. Update frontend to handle new booking statuses');
    console.log('5. Set up proper monitoring for email failures');
    
  } catch (error) {
    console.error('❌ Error running fixes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Perform system health check
const performHealthCheck = async () => {
  try {
    const Booking = mongoose.model('Booking');
    const PromoCode = mongoose.model('PromoCode');
    
    // Check recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('status paymentStatus confirmationEmailSentAt createdAt')
      .lean();
    
    console.log('📊 Recent bookings status:');
    recentBookings.forEach((booking, index) => {
      const hasConfirmation = booking.confirmationEmailSentAt ? '✅' : '❌';
      console.log(`  ${index + 1}. ${booking.status}/${booking.paymentStatus} - Email: ${hasConfirmation}`);
    });
    
    // Check promo codes
    const activePromos = await PromoCode.countDocuments({ active: true });
    console.log(`\n🎫 Active promo codes: ${activePromos}`);
    
    // Check pending bookings
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const holdBookings = await Booking.countDocuments({ status: 'hold' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    
    console.log(`\n📋 Booking status summary:`);
    console.log(`  Pending: ${pendingBookings}`);
    console.log(`  On Hold: ${holdBookings}`);
    console.log(`  Confirmed: ${confirmedBookings}`);
    
    // Check for bookings without confirmation emails
    const missingConfirmations = await Booking.countDocuments({
      paymentStatus: 'paid',
      status: 'confirmed',
      confirmationEmailSentAt: { $exists: false }
    });
    
    console.log(`\n📧 Missing confirmation emails: ${missingConfirmations}`);
    
    if (missingConfirmations === 0) {
      console.log('✅ All paid bookings have confirmation emails!');
    } else {
      console.log(`⚠️  ${missingConfirmations} bookings still missing confirmation emails`);
    }
    
  } catch (error) {
    console.error('❌ Error performing health check:', error);
  }
};

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllFixes();
}

export { runAllFixes, performHealthCheck };
