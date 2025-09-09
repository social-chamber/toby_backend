/**
 * URL utility functions for cleaning and validating Cloudinary URLs
 */

/**
 * Cleans duplicate file extensions from URLs
 * @param {string} url - The URL to clean
 * @returns {string} - The cleaned URL
 */
export function cleanDuplicateExtensions(url) {
  if (!url || typeof url !== 'string') return url;
  
  // Remove duplicate extensions like .jpg.jpg, .mp4.mp4, etc.
  const cleanedUrl = url.replace(/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|mkv|webm)\.\1/gi, '.$1');
  
  return cleanedUrl;
}

/**
 * Ensures a URL is absolute and properly formatted
 * @param {string} url - The URL to format
 * @returns {string} - The formatted URL
 */
export function ensureAbsoluteUrl(url) {
  if (!url || typeof url !== 'string') return url;
  
  // Clean duplicate extensions first
  let cleanedUrl = cleanDuplicateExtensions(url);
  
  // If it's already a full URL, return as is
  if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) {
    return cleanedUrl;
  }
  
  // If it's a Cloudinary URL without protocol, add https
  if (cleanedUrl.includes('res.cloudinary.com') && !cleanedUrl.startsWith('http')) {
    return `https://${cleanedUrl}`;
  }
  
  return cleanedUrl;
}

/**
 * Validates if a URL is a valid Cloudinary URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid Cloudinary URL
 */
export function isValidCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') return false;

  // Check if it's a valid Cloudinary URL pattern
  // Removed unnecessary escape characters from the regex
  const cloudinaryPattern = /^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/[^/]+\/[^/]+$/;
  return cloudinaryPattern.test(url);
}

/**
 * Processes an object recursively to clean all URL fields
 * @param {any} data - The data to process
 * @returns {any} - The processed data with cleaned URLs
 */
export function cleanUrlsInData(data, seen) {
  if (data == null) return data;

  // Strings: clean and return
  if (typeof data === 'string') {
    return cleanDuplicateExtensions(data);
  }

  // Primitives: return as-is
  if (typeof data !== 'object') return data;

  // Initialize WeakSet for cycle detection
  const visited = seen || new WeakSet();
  if (visited.has(data)) return data;

  // Skip special object types that shouldn't be traversed
  if (data instanceof Date || data instanceof RegExp || (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(data))) {
    return data;
  }

  // Handle Mongoose documents safely by converting to plain object when possible
  const isMongooseDoc = !!(data && (data.$__ || (data.constructor && data.constructor.name === 'model')));
  if (isMongooseDoc) {
    try {
      const plain = typeof data.toObject === 'function' ? data.toObject({ getters: false, virtuals: false }) : data;
      return cleanUrlsInData(plain, visited);
    } catch {
      return data;
    }
  }

  // Arrays
  if (Array.isArray(data)) {
    visited.add(data);
    return data.map(item => cleanUrlsInData(item, visited));
  }

  // Only traverse plain objects
  const proto = Object.getPrototypeOf(data);
  const isPlainObject = proto === Object.prototype || proto === null;
  if (!isPlainObject) {
    return data;
  }

  visited.add(data);
  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    if (['image', 'thumbnail', 'avatar', 'url', 'video'].includes(key)) {
      if (typeof value === 'string') {
        cleaned[key] = cleanDuplicateExtensions(value);
      } else if (value && typeof value === 'object' && 'url' in value && typeof value.url === 'string') {
        cleaned[key] = { ...value, url: cleanDuplicateExtensions(value.url) };
      } else {
        cleaned[key] = value;
      }
    } else {
      cleaned[key] = cleanUrlsInData(value, visited);
    }
  }
  return cleaned;
}

/**
 * Sanitizes a filename for Cloudinary upload
 * @param {string} filename - The original filename
 * @returns {string} - The sanitized filename
 */
export function sanitizeFilename(filename) {
  if (!filename) return '';
  
  // Remove file extension and special characters
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  return sanitized || 'file';
}
