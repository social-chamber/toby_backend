import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from '../src/entities/booking/booking.model.js';
import Service from '../src/entities/admin/Services/createServices.model.js';

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

// Fix pricing consistency issues
const fixPricingConsistency = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Analyzing pricing consistency issues...\n');
    
    // Get all bookings that don't have priceAtCheckout set
    const bookingsWithoutSnapshot = await Booking.find({
      priceAtCheckout: { $exists: false }
    })
    .populate('service')
    .sort({ createdAt: -1 });

    console.log(`📊 Found ${bookingsWithoutSnapshot.length} bookings without price snapshots\n`);
    
    if (bookingsWithoutSnapshot.length === 0) {
      console.log('🎉 All bookings already have price snapshots!');
      return;
    }

    const results = {
      updated: [],
      errors: []
    };

    // Process each booking
    for (let i = 0; i < bookingsWithoutSnapshot.length; i++) {
      const booking = bookingsWithoutSnapshot[i];
      console.log(`📋 Processing booking ${i + 1}/${bookingsWithoutSnapshot.length}: ${booking._id}`);
      
      try {
        // Calculate what the price should have been at checkout time
        const service = booking.service;
        if (!service) {
          console.log(`  ⚠️  Service not found for booking ${booking._id}`);
          results.errors.push({
            bookingId: booking._id,
            error: 'Service not found'
          });
          continue;
        }

        // Calculate price using the same logic as frontend/backend
        const pricePerSlot = (service.pricePerSlot || 0) + 1; // Match frontend +$1 logic
        const calculatedPrice = pricePerSlot * booking.timeSlots.length * booking.user.numberOfPeople;
        
        // Check if there's a discrepancy
        const currentTotal = booking.total;
        const hasDiscrepancy = Math.abs(currentTotal - calculatedPrice) > 0.01;
        
        console.log(`  Current total: $${currentTotal}`);
        console.log(`  Calculated price: $${calculatedPrice}`);
        console.log(`  Discrepancy: ${hasDiscrepancy ? 'YES' : 'NO'}`);
        
        // Update booking with price snapshot
        await Booking.findByIdAndUpdate(booking._id, {
          priceAtCheckout: currentTotal, // Store the actual price that was charged
          originalServicePrice: service.pricePerSlot, // Store original service price
          priceCalculationMethod: 'legacy', // Mark as legacy calculation
          pricingDiscrepancy: hasDiscrepancy ? Math.abs(currentTotal - calculatedPrice) : 0
        });
        
        results.updated.push({
          bookingId: booking._id,
          currentTotal,
          calculatedPrice,
          discrepancy: hasDiscrepancy ? Math.abs(currentTotal - calculatedPrice) : 0,
          userEmail: booking.user.email
        });
        
        console.log(`  ✅ Updated with price snapshot: $${currentTotal}`);
        
      } catch (error) {
        console.error(`  ❌ Error processing booking ${booking._id}:`, error.message);
        results.errors.push({
          bookingId: booking._id,
          error: error.message
        });
      }
      
      console.log('');
    }

    // Summary
    console.log('📊 SUMMARY:');
    console.log(`✅ Successfully updated: ${results.updated.length} bookings`);
    console.log(`❌ Errors: ${results.errors.length} bookings`);
    
    if (results.updated.length > 0) {
      console.log('\n✅ Updated bookings:');
      results.updated.forEach(update => {
        const discrepancyText = update.discrepancy > 0 ? ` (Discrepancy: $${update.discrepancy.toFixed(2)})` : '';
        console.log(`  - ${update.bookingId}: $${update.currentTotal} → ${update.userEmail}${discrepancyText}`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log('\n❌ Failed bookings:');
      results.errors.forEach(error => {
        console.log(`  - ${error.bookingId}: ${error.error}`);
      });
    }

    // Show pricing statistics
    console.log('\n📈 Pricing Statistics:');
    const totalDiscrepancy = results.updated.reduce((sum, update) => sum + update.discrepancy, 0);
    const bookingsWithDiscrepancy = results.updated.filter(update => update.discrepancy > 0).length;
    
    console.log(`Total discrepancy amount: $${totalDiscrepancy.toFixed(2)}`);
    console.log(`Bookings with discrepancies: ${bookingsWithDiscrepancy}/${results.updated.length}`);
    
    if (bookingsWithDiscrepancy > 0) {
      console.log('\n💡 Recommendations:');
      console.log('1. Review bookings with discrepancies for potential refunds');
      console.log('2. Ensure frontend and backend pricing logic are synchronized');
      console.log('3. Consider implementing price validation at checkout');
      console.log('4. Monitor for future pricing inconsistencies');
    }

  } catch (error) {
    console.error('❌ Error fixing pricing consistency:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Utility function to validate pricing consistency for new bookings
const validatePricingConsistency = async (bookingData) => {
  try {
    const { service, timeSlots, numberOfPeople } = bookingData;
    
    // Get service details
    const serviceDoc = await Service.findById(service);
    if (!serviceDoc) {
      throw new Error('Service not found');
    }
    
    // Calculate expected price using consistent logic
    const pricePerSlot = (serviceDoc.pricePerSlot || 0) + 1; // Match frontend +$1 logic
    const expectedTotal = pricePerSlot * timeSlots.length * numberOfPeople;
    
    return {
      servicePrice: serviceDoc.pricePerSlot,
      adjustedPricePerSlot: pricePerSlot,
      expectedTotal,
      timeSlots: timeSlots.length,
      numberOfPeople
    };
  } catch (error) {
    console.error('Error validating pricing consistency:', error);
    throw error;
  }
};

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  fixPricingConsistency();
}

export { fixPricingConsistency, validatePricingConsistency };
