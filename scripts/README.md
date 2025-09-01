# Backend Cleanup Scripts

This directory contains scripts to fix URL issues and ensure proper Cloudinary integration.

## 🚀 Quick Start

Run the comprehensive cleanup:

```bash
node scripts/cleanup-all.js
```

## 📝 Individual Scripts

### 1. `fix-duplicate-extensions.js`
Fixes database records with duplicate file extensions (e.g., `.jpg.jpg`, `.mp4.mp4`).

**What it does:**
- Scans all entities (Room, Category, User, CMS) for duplicate extensions
- Cleans URLs by removing duplicate extensions
- Updates database records automatically

**Usage:**
```bash
node scripts/fix-duplicate-extensions.js
```

### 2. `upload-missing-files.js`
Checks for broken Cloudinary URLs and identifies missing files.

**What it does:**
- Tests all Cloudinary URLs in the database
- Reports broken/inaccessible URLs
- Lists local files that might need uploading
- Provides recommendations for fixing issues

**Usage:**
```bash
node scripts/upload-missing-files.js
```

### 3. `cleanup-all.js`
Master script that runs both cleanup operations in sequence.

**Usage:**
```bash
node scripts/cleanup-all.js
```

## 🔧 What's Fixed

### Backend Changes Made:

1. **URL Cleanup Middleware** (`src/core/middlewares/urlCleanupMiddleware.js`)
   - Automatically cleans URLs in all responses
   - Removes duplicate extensions
   - Ensures proper URL formatting

2. **Enhanced Cloudinary Upload** (`src/lib/cloudinaryUpload.js`)
   - Better file naming with sanitization
   - Ensures secure URLs are always returned
   - Improved error handling

3. **URL Utilities** (`src/lib/urlUtils.js`)
   - Functions to clean and validate URLs
   - Recursive data processing for nested objects
   - Filename sanitization

4. **Response Formatter** (`src/lib/responseFormate.js`)
   - Automatically cleans URLs before sending responses
   - Ensures consistent URL format across all endpoints

## 🎯 Expected Results

After running the cleanup:

- ✅ All duplicate extensions are removed
- ✅ All URLs are properly formatted
- ✅ Cloudinary URLs are validated
- ✅ Frontend images/videos should load without "?" icons
- ✅ No more 404 errors for asset URLs

## 🚨 Important Notes

1. **Backup your database** before running cleanup scripts
2. **Restart your backend server** after cleanup
3. **Test thoroughly** in development before deploying
4. **Monitor logs** for any errors during cleanup

## 🔍 Troubleshooting

### If images still don't load:

1. Check if the cleanup scripts ran successfully
2. Verify Cloudinary credentials in your environment
3. Check browser console for any remaining 404s
4. Ensure your frontend is using the updated backend

### If you see errors:

1. Check MongoDB connection
2. Verify environment variables
3. Ensure all required models are imported
4. Check file permissions for uploads directory

## 📞 Support

If you encounter issues:
1. Check the script output for specific error messages
2. Review your Cloudinary dashboard for upload status
3. Verify your database connection and credentials
4. Check that all required dependencies are installed
