import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from '../src/entities/booking/booking.model.js';
import PromoCode from '../src/entities/promo_code/promo_code.model.js';

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

// Fix promo code usage counts
const fixPromoCounts = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Analyzing promo code usage counts...\n');
    
    // Get all promo codes
    const promoCodes = await PromoCode.find({ active: true });
    console.log(`📊 Found ${promoCodes.length} active promo codes\n`);
    
    const results = [];
    
    for (const promo of promoCodes) {
      console.log(`🔍 Analyzing promo code: ${promo.code}`);
      
      // Count actual usage from bookings
      const actualUsage = await Booking.countDocuments({
        promoCode: promo._id,
        status: { $in: ['confirmed', 'pending'] },
        paymentStatus: { $in: ['paid', 'pending'] }
      });
      
      // Count successful redemptions (paid bookings)
      const successfulRedemptions = await Booking.countDocuments({
        promoCode: promo._id,
        status: 'confirmed',
        paymentStatus: 'paid'
      });
      
      // Get promo code details
      const promoDetails = {
        code: promo.code,
        currentUsageCount: promo.usageCount || 0,
        actualUsageFromBookings: actualUsage,
        successfulRedemptions: successfulRedemptions,
        maxUsage: promo.maxUsage || 'unlimited',
        isActive: promo.active,
        expiryDate: promo.expiryDate
      };
      
      console.log(`  Current usage count: ${promoDetails.currentUsageCount}`);
      console.log(`  Actual bookings using this promo: ${promoDetails.actualUsageFromBookings}`);
      console.log(`  Successful redemptions: ${promoDetails.successfulRedemptions}`);
      console.log(`  Max usage: ${promoDetails.maxUsage}`);
      
      // Check if counts match
      const countsMatch = promoDetails.currentUsageCount === promoDetails.actualUsageFromBookings;
      
      if (!countsMatch) {
        console.log(`  ⚠️  MISMATCH DETECTED!`);
        
        // Update the promo code with correct count
        await PromoCode.findByIdAndUpdate(promo._id, {
          usageCount: promoDetails.actualUsageFromBookings
        });
        
        console.log(`  ✅ Updated usage count to: ${promoDetails.actualUsageFromBookings}`);
      } else {
        console.log(`  ✅ Counts match correctly`);
      }
      
      results.push({
        ...promoDetails,
        countsMatch,
        wasFixed: !countsMatch
      });
      
      console.log('');
    }
    
    // Summary
    console.log('📊 SUMMARY:');
    const mismatched = results.filter(r => !r.countsMatch);
    const fixed = results.filter(r => r.wasFixed);
    
    console.log(`Total promo codes analyzed: ${results.length}`);
    console.log(`Mismatched counts: ${mismatched.length}`);
    console.log(`Fixed counts: ${fixed.length}`);
    
    if (mismatched.length > 0) {
      console.log('\n❌ Promo codes with mismatched counts:');
      mismatched.forEach(promo => {
        console.log(`  - ${promo.code}: stored=${promo.currentUsageCount}, actual=${promo.actualUsageFromBookings}`);
      });
    }
    
    // Show recent promo code usage
    console.log('\n📋 Recent promo code usage (last 10):');
    const recentPromoUsage = await Booking.find({
      promoCode: { $exists: true, $ne: null }
    })
    .populate('promoCode', 'code')
    .sort({ createdAt: -1 })
    .limit(10)
    .select('createdAt user.email promoCode status paymentStatus total')
    .lean();
    
    recentPromoUsage.forEach((booking, index) => {
      const promoCode = booking.promoCode?.code || 'Unknown';
      const status = `${booking.status}/${booking.paymentStatus}`;
      const total = booking.total;
      
      console.log(`  ${index + 1}. ${promoCode} - ${status} - $${total} - ${booking.user.email}`);
    });
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('1. Always update promo usage count when a booking is created with a promo code');
    console.log('2. Use atomic operations to prevent race conditions');
    console.log('3. Consider using MongoDB transactions for promo code updates');
    console.log('4. Add validation to prevent over-usage of promo codes');
    
  } catch (error) {
    console.error('❌ Error fixing promo counts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Utility function to get promo usage statistics
export const getPromoUsageStats = async (promoCodeId) => {
  try {
    const stats = await Booking.aggregate([
      { $match: { promoCode: promoCodeId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' }
        }
      }
    ]);
    
    return stats;
  } catch (error) {
    console.error('Error getting promo usage stats:', error);
    throw error;
  }
};

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  fixPromoCounts();
}

export { fixPromoCounts };
