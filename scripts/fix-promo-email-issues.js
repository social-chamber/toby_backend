import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PromoCode from '../src/entities/promo_code/promo_code.model.js';
import Booking from '../src/entities/booking/booking.model.js';

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

// Fix promo code email and counting issues
const fixPromoEmailIssues = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Analyzing promo code email and counting issues...\n');
    
    // 1. Fix promo code count discrepancies
    console.log('📊 STEP 1: Fixing promo code count discrepancies...');
    console.log('=' .repeat(50));
    
    const promoCodes = await PromoCode.find({ active: true });
    console.log(`Found ${promoCodes.length} active promo codes\n`);
    
    const countResults = [];
    
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
      
      console.log(`  Current usedCount: ${promo.usedCount}`);
      console.log(`  Current usageCount: ${promo.usageCount || 0}`);
      console.log(`  Actual bookings using this promo: ${actualUsage}`);
      console.log(`  Successful redemptions: ${successfulRedemptions}`);
      
      // Sync both count fields
      const maxCount = Math.max(actualUsage, promo.usedCount, promo.usageCount || 0);
      
      if (promo.usedCount !== maxCount || promo.usageCount !== maxCount) {
        await PromoCode.findByIdAndUpdate(promo._id, {
          usedCount: maxCount,
          usageCount: maxCount
        });
        
        console.log(`  ✅ Updated both counts to: ${maxCount}`);
        countResults.push({
          code: promo.code,
          oldUsedCount: promo.usedCount,
          oldUsageCount: promo.usageCount || 0,
          newCount: maxCount,
          actualUsage,
          successfulRedemptions
        });
      } else {
        console.log(`  ✅ Counts are already consistent`);
      }
      
      console.log('');
    }
    
    // 2. Analyze email recipient data
    console.log('📧 STEP 2: Analyzing email recipient data...');
    console.log('=' .repeat(50));
    
    const distinctEmails = await Booking.distinct('user.email');
    const validEmails = distinctEmails.filter(email => email && email.includes('@'));
    
    console.log(`Total unique email addresses: ${distinctEmails.length}`);
    console.log(`Valid email addresses: ${validEmails.length}`);
    console.log(`Invalid email addresses: ${distinctEmails.length - validEmails.length}`);
    
    // Show email domain distribution
    const emailDomains = {};
    validEmails.forEach(email => {
      const domain = email.split('@')[1];
      emailDomains[domain] = (emailDomains[domain] || 0) + 1;
    });
    
    console.log('\n📊 Top email domains:');
    Object.entries(emailDomains)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([domain, count]) => {
        console.log(`  ${domain}: ${count} users`);
      });
    
    // 3. Check for potential email delivery issues
    console.log('\n📧 STEP 3: Checking for email delivery issues...');
    console.log('=' .repeat(50));
    
    // Check for common problematic email patterns
    const problematicEmails = validEmails.filter(email => {
      const domain = email.split('@')[1];
      return domain.includes('test') || 
             domain.includes('example') || 
             domain.includes('temp') ||
             email.includes('test@') ||
             email.includes('demo@');
    });
    
    if (problematicEmails.length > 0) {
      console.log(`⚠️  Found ${problematicEmails.length} potentially problematic emails:`);
      problematicEmails.slice(0, 10).forEach(email => {
        console.log(`  - ${email}`);
      });
      if (problematicEmails.length > 10) {
        console.log(`  ... and ${problematicEmails.length - 10} more`);
      }
    } else {
      console.log('✅ No obviously problematic emails found');
    }
    
    // 4. Summary and recommendations
    console.log('\n📊 SUMMARY:');
    console.log('=' .repeat(50));
    
    const fixedCounts = countResults.filter(r => r.oldUsedCount !== r.newCount || r.oldUsageCount !== r.newCount);
    
    console.log(`✅ Promo codes analyzed: ${promoCodes.length}`);
    console.log(`✅ Count discrepancies fixed: ${fixedCounts.length}`);
    console.log(`✅ Valid email recipients: ${validEmails.length}`);
    console.log(`⚠️  Problematic emails: ${problematicEmails.length}`);
    
    if (fixedCounts.length > 0) {
      console.log('\n✅ Fixed promo code counts:');
      fixedCounts.forEach(fix => {
        console.log(`  - ${fix.code}: ${fix.oldUsedCount}/${fix.oldUsageCount} → ${fix.newCount}`);
      });
    }
    
    console.log('\n💡 Recommendations:');
    console.log('1. Use the new enhanced email system for better tracking');
    console.log('2. Implement email validation before sending campaigns');
    console.log('3. Set up email bounce handling and retry logic');
    console.log('4. Monitor email delivery rates and engagement');
    console.log('5. Consider migrating to professional email service (SendGrid/Postmark)');
    
    // 5. Show recent promo code usage
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
    
  } catch (error) {
    console.error('❌ Error fixing promo email issues:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  fixPromoEmailIssues();
}

export { fixPromoEmailIssues };
