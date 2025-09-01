import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { cloudinaryUpload } from '../src/lib/cloudinaryUpload.js';
import Room from '../src/entities/room/room.model.js';
import Category from '../src/entities/category/category.model.js';
import User from '../src/entities/user/user.model.js';
import CMS from '../src/entities/admin/CMS/cms.model.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Function to check if a Cloudinary URL is accessible
async function checkCloudinaryUrl(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Function to find local files that might be missing from Cloudinary
function findLocalFiles() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const files = [];
  
  if (fs.existsSync(uploadsDir)) {
    const imagesDir = path.join(uploadsDir, 'images');
    const videosDir = path.join(uploadsDir, 'videos');
    
    if (fs.existsSync(imagesDir)) {
      const imageFiles = fs.readdirSync(imagesDir);
      imageFiles.forEach(file => {
        files.push({
          path: path.join(imagesDir, file),
          type: 'image',
          filename: file
        });
      });
    }
    
    if (fs.existsSync(videosDir)) {
      const videoFiles = fs.readdirSync(videosDir);
      videoFiles.forEach(file => {
        files.push({
          path: path.join(videosDir, file),
          type: 'video',
          filename: file
        });
      });
    }
  }
  
  return files;
}

// Function to upload missing files to Cloudinary
async function uploadMissingFiles() {
  try {
    console.log('🔍 Checking for missing files...\n');

    // Check existing database records for broken URLs
    console.log('📊 Checking database records for broken URLs...');
    
    const rooms = await Room.find({});
    let brokenRoomUrls = 0;
    
    for (const room of rooms) {
      if (room.image) {
        const isAccessible = await checkCloudinaryUrl(room.image);
        if (!isAccessible) {
          console.log(`  ❌ Broken room image URL: ${room.title} - ${room.image}`);
          brokenRoomUrls++;
        }
      }
    }
    
    const categories = await Category.find({});
    let brokenCategoryUrls = 0;
    
    for (const category of categories) {
      if (category.image) {
        const isAccessible = await checkCloudinaryUrl(category.image);
        if (!isAccessible) {
          console.log(`  ❌ Broken category image URL: ${category.name} - ${category.image}`);
          brokenCategoryUrls++;
        }
      }
    }
    
    const users = await User.find({});
    let brokenUserUrls = 0;
    
    for (const user of users) {
      if (user.avatar && user.avatar.url) {
        const isAccessible = await checkCloudinaryUrl(user.avatar.url);
        if (!isAccessible) {
          console.log(`  ❌ Broken user avatar URL: ${user.name || user.email} - ${user.avatar.url}`);
          brokenUserUrls++;
        }
      }
    }
    
    const cmsContent = await CMS.find({});
    let brokenCmsUrls = 0;
    
    for (const item of cmsContent) {
      if (item.thumbnail) {
        const isAccessible = await checkCloudinaryUrl(item.thumbnail);
        if (!isAccessible) {
          console.log(`  ❌ Broken CMS thumbnail URL: ${item.title || item._id} - ${item.thumbnail}`);
          brokenCmsUrls++;
        }
      }
      
      if (item.url) {
        const isAccessible = await checkCloudinaryUrl(item.url);
        if (!isAccessible) {
          console.log(`  ❌ Broken CMS content URL: ${item.title || item._id} - ${item.url}`);
          brokenCmsUrls++;
        }
      }
    }
    
    console.log(`\n📈 Summary of broken URLs:`);
    console.log(`  Rooms: ${brokenRoomUrls}`);
    console.log(`  Categories: ${brokenCategoryUrls}`);
    console.log(`  Users: ${brokenUserUrls}`);
    console.log(`  CMS: ${brokenCmsUrls}`);
    console.log(`  Total: ${brokenRoomUrls + brokenCategoryUrls + brokenUserUrls + brokenCmsUrls}\n`);

    // Check for local files that might need uploading
    console.log('📁 Checking for local files that might need uploading...');
    const localFiles = findLocalFiles();
    
    if (localFiles.length === 0) {
      console.log('  ℹ️  No local files found in uploads directory');
    } else {
      console.log(`  📂 Found ${localFiles.length} local files`);
      
      for (const file of localFiles) {
        console.log(`    ${file.type.toUpperCase()}: ${file.filename}`);
      }
      
      console.log('\n  💡 If any of these files correspond to broken URLs above,');
      console.log('     you may need to manually upload them to Cloudinary and');
      console.log('     update the database records accordingly.');
    }

    console.log('\n🎯 Recommendations:');
    console.log('  1. Fix any broken URLs by updating database records');
    console.log('  2. Upload missing files to Cloudinary if they exist locally');
    console.log('  3. Ensure all new uploads use the secure_url from Cloudinary');
    console.log('  4. Consider implementing URL validation in your upload process');

  } catch (error) {
    console.error('❌ Error during file check:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the check
uploadMissingFiles();
