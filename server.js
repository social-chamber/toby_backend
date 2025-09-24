import mongoose from 'mongoose';
import cron from 'node-cron';
import logger from './src/core/config/logger.js';
import app from './src/app.js';
import { mongoURI, port } from './src/core/config/config.js';
import { cleanupFailedPaymentBookings } from './src/entities/booking/booking.service.js';
mongoose
  .connect(mongoURI)
  .then(() => {
    logger.info('MongoDB connected');
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      
      // Initialize scheduled cleanup jobs
      initializeScheduledJobs();
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
  });

// Initialize scheduled jobs for cleanup
function initializeScheduledJobs() {
  try {
    // Schedule cleanup for failed payment bookings every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        await cleanupFailedPaymentBookings();
      } catch (error) {
        logger.error('❌ Failed to run payment cleanup:', error.message);
      }
    });
    
    logger.info('✅ Scheduled jobs initialized - Payment cleanup every 5 minutes');
  } catch (error) {
    logger.error('❌ Failed to initialize scheduled jobs:', error.message);
  }
}
