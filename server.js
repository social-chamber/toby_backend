import mongoose from 'mongoose';
import cron from 'node-cron';
import logger from './src/core/config/logger.js';
import app from './src/app.js';
import { mongoURI, port } from './src/core/config/config.js';
import expirePendingBookings from './src/lib/expiresAt.js';
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

// Initialize scheduled jobs (cleanup disabled since bookings don't expire)
function initializeScheduledJobs() {
  try {
    // Note: Cleanup jobs disabled since bookings no longer expire
    // Keeping function for future maintenance tasks if needed
    
    logger.info('ℹ️ Scheduled jobs initialized (cleanup disabled - bookings don\'t expire)');
  } catch (error) {
    logger.error('❌ Failed to initialize scheduled jobs:', error.message);
  }
}
