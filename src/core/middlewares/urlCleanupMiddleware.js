import { cleanUrlsInData } from '../../lib/urlUtils.js';

/**
 * Middleware to clean URLs in response data
 * This ensures all URLs are properly formatted and don't have duplicate extensions
 */
export const urlCleanupMiddleware = (req, res, next) => {
  try {
    // Store the original json method
    const originalJson = res.json;
    
    // Override the json method to clean URLs before sending
    res.json = function(data) {
      try {
        if (data && typeof data === 'object') {
          // Clean URLs in the response data
          const cleanedData = cleanUrlsInData(data);
          return originalJson.call(this, cleanedData);
        }
        
        return originalJson.call(this, data);
      } catch (err) {
        console.error('urlCleanupMiddleware json override error', err);
        return originalJson.call(this, data);
      }
    };
    
    return next();
  } catch (err) {
    console.error('urlCleanupMiddleware error', err);
    return next();
  }
};
