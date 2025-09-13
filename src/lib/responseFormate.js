import { cleanUrlsInData } from './urlUtils.js';

export const generateResponse = (res, statusCode, status, message, data) => {
  try {
    if (res.headersSent) {
      // If headers already sent, do nothing
      console.warn('generateResponse: headers already sent, skipping response');
      return;
    }
    
    // Clean URLs in the response data before sending
    const cleanedData = data ? cleanUrlsInData(data) : data;
    
    res.status(statusCode).json({ status, message, data: cleanedData });
  } catch (err) {
    // very defensive: if even this fails, log and ignore to avoid crash
    console.error('generateResponse error', err);
  }
};

