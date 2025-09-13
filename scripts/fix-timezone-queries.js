import mongoose from 'mongoose';
import dotenv from 'dotenv';
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

// Fix timezone issues in booking queries
const fixTimezoneQueries = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Analyzing timezone issues in booking queries...\n');
    
    // Get current date in different timezones
    const now = new Date();
    const utcNow = new Date(now.toISOString());
    
    // Singapore timezone (UTC+8)
    const singaporeOffset = 8 * 60; // 8 hours in minutes
    const singaporeTime = new Date(utcNow.getTime() + (singaporeOffset * 60 * 1000));
    
    console.log('📅 Current times:');
    console.log(`  UTC: ${utcNow.toISOString()}`);
    console.log(`  Singapore: ${singaporeTime.toISOString()}`);
    console.log(`  Local: ${now.toISOString()}\n`);
    
    // Test different query approaches
    console.log('🧪 Testing different query approaches for today\'s bookings:\n');
    
    // Approach 1: Local timezone (current problematic approach)
    const localStart = new Date();
    localStart.setHours(0, 0, 0, 0);
    const localEnd = new Date();
    localEnd.setHours(23, 59, 59, 999);
    
    const localBookings = await Booking.find({
      createdAt: { $gte: localStart, $lte: localEnd }
    }).count();
    
    console.log(`1. Local timezone query: ${localBookings} bookings`);
    console.log(`   Start: ${localStart.toISOString()}`);
    console.log(`   End: ${localEnd.toISOString()}\n`);
    
    // Approach 2: UTC timezone (recommended)
    const utcStart = new Date();
    utcStart.setUTCHours(0, 0, 0, 0);
    const utcEnd = new Date();
    utcEnd.setUTCHours(23, 59, 59, 999);
    
    const utcBookings = await Booking.find({
      createdAt: { $gte: utcStart, $lte: utcEnd }
    }).count();
    
    console.log(`2. UTC timezone query: ${utcBookings} bookings`);
    console.log(`   Start: ${utcStart.toISOString()}`);
    console.log(`   End: ${utcEnd.toISOString()}\n`);
    
    // Approach 3: Singapore timezone
    const sgStart = new Date(utcStart.getTime() - (singaporeOffset * 60 * 1000));
    const sgEnd = new Date(utcEnd.getTime() - (singaporeOffset * 60 * 1000));
    
    const sgBookings = await Booking.find({
      createdAt: { $gte: sgStart, $lte: sgEnd }
    }).count();
    
    console.log(`3. Singapore timezone query: ${sgBookings} bookings`);
    console.log(`   Start: ${sgStart.toISOString()}`);
    console.log(`   End: ${sgEnd.toISOString()}\n`);
    
    // Show recent bookings to understand the data
    console.log('📋 Recent bookings (last 10):');
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('createdAt user.email status paymentStatus')
      .lean();
    
    recentBookings.forEach((booking, index) => {
      const localTime = new Date(booking.createdAt).toLocaleString('en-SG', {
        timeZone: 'Asia/Singapore',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      console.log(`  ${index + 1}. ${booking._id} - ${localTime} (SG) - ${booking.status}/${booking.paymentStatus} - ${booking.user.email}`);
    });
    
    console.log('\n💡 Recommendations:');
    console.log('1. Use UTC queries for consistency across timezones');
    console.log('2. Convert to local timezone in the frontend for display');
    console.log('3. Store all dates in UTC in the database');
    console.log('4. Use moment.js or date-fns for timezone handling in frontend');
    
  } catch (error) {
    console.error('❌ Error analyzing timezone issues:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Utility function to get UTC day boundaries
const getUTCDayBoundaries = (date = new Date()) => {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  
  return { start, end };
};

// Utility function to get Singapore day boundaries
export const getSingaporeDayBoundaries = (date = new Date()) => {
  const singaporeOffset = 8 * 60; // 8 hours in minutes
  
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  start.setTime(start.getTime() - (singaporeOffset * 60 * 1000));
  
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  end.setTime(end.getTime() - (singaporeOffset * 60 * 1000));
  
  return { start, end };
};

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  fixTimezoneQueries();
}

export { fixTimezoneQueries, getUTCDayBoundaries };
