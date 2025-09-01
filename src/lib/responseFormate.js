import { cleanUrlsInData } from './urlUtils.js';

export const generateResponse = (res, statusCode, status, message, data) => {
  // Clean URLs in the response data before sending
  const cleanedData = data ? cleanUrlsInData(data) : data;
  
  res.status(statusCode).json({ status, message, data: cleanedData });
};

