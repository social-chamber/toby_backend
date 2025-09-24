import mongoose from 'mongoose';
import cron from 'node-cron';
import logger from './src/core/config/logger.js';
import app from './src/app.js';
import { mongoURI, port } from './src/core/config/config.js';
import { cleanupExpiredHoldsAndFailedPayments } from './src/entities/booking/booking.service.js';
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
    // Schedule cleanup for failed payments every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      try {
        await cleanupExpiredHoldsAndFailedPayments();
      } catch (error) {
        logger.error('❌ Failed to run payment cleanup:', error.message);
      }
    });
    
    logger.info('✅ Scheduled jobs initialized - Payment cleanup every 30 minutes');
  } catch (error) {
    logger.error('❌ Failed to initialize scheduled jobs:', error.message);
  }
}
