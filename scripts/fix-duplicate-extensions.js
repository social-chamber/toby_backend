import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Room from '../src/entities/room/room.model.js';
import Category from '../src/entities/category/category.model.js';
import User from '../src/entities/user/user.model.js';
import CMS from '../src/entities/admin/CMS/cms.model.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Function to clean duplicate extensions
function cleanDuplicateExtensions(url) {
  if (!url || typeof url !== 'string') return url;
  
  // Remove duplicate extensions like .jpg.jpg, .mp4.mp4, etc.
  const cleanedUrl = url.replace(/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|mkv|webm)\.\1/gi, '.$1');
  
  return cleanedUrl;
}

// Function to check if URL is a valid Cloudinary URL
function isValidCloudinaryUrl(url) {
  return url && url.includes('res.cloudinary.com');
}

async function fixDuplicateExtensions() {
  try {
    console.log('🔍 Checking for duplicate extensions...\n');

    // Fix Room images
    console.log('📸 Checking Room images...');
    const rooms = await Room.find({});
    let roomUpdates = 0;
    
    for (const room of rooms) {
      if (room.image) {
        const originalUrl = room.image;
        const cleanedUrl = cleanDuplicateExtensions(room.image);
        
        if (originalUrl !== cleanedUrl) {
          console.log(`  Room "${room.title}":`);
          console.log(`    Before: ${originalUrl}`);
          console.log(`    After:  ${cleanedUrl}`);
          
          await Room.findByIdAndUpdate(room._id, { image: cleanedUrl });
          roomUpdates++;
        }
      }
    }
    console.log(`  ✅ Updated ${roomUpdates} room images\n`);

    // Fix Category images
    console.log('🏷️  Checking Category images...');
    const categories = await Category.find({});
    let categoryUpdates = 0;
    
    for (const category of categories) {
      if (category.image) {
        const originalUrl = category.image;
        const cleanedUrl = cleanDuplicateExtensions(category.image);
        
        if (originalUrl !== cleanedUrl) {
          console.log(`  Category "${category.name}":`);
          console.log(`    Before: ${originalUrl}`);
          console.log(`    After:  ${cleanedUrl}`);
          
          await Category.findByIdAndUpdate(category._id, { image: cleanedUrl });
          categoryUpdates++;
        }
      }
    }
    console.log(`  ✅ Updated ${categoryUpdates} category images\n`);

    // Fix User avatars
    console.log('👤 Checking User avatars...');
    const users = await User.find({});
    let userUpdates = 0;
    
    for (const user of users) {
      if (user.avatar && user.avatar.url) {
        const originalUrl = user.avatar.url;
        const cleanedUrl = cleanDuplicateExtensions(user.avatar.url);
        
        if (originalUrl !== cleanedUrl) {
          console.log(`  User "${user.name || user.email}":`);
          console.log(`    Before: ${originalUrl}`);
          console.log(`    After:  ${cleanedUrl}`);
          
          await User.findByIdAndUpdate(user._id, { 'avatar.url': cleanedUrl });
          userUpdates++;
        }
      }
    }
    console.log(`  ✅ Updated ${userUpdates} user avatars\n`);

    // Fix CMS content
    console.log('📝 Checking CMS content...');
    const cmsContent = await CMS.find({});
    let cmsUpdates = 0;
    
    for (const item of cmsContent) {
      let updated = false;
      const updateData = {};
      
      if (item.thumbnail) {
        const originalUrl = item.thumbnail;
        const cleanedUrl = cleanDuplicateExtensions(item.thumbnail);
        
        if (originalUrl !== cleanedUrl) {
          console.log(`  CMS "${item.title || item._id}":`);
          console.log(`    Before: ${originalUrl}`);
          console.log(`    After:  ${cleanedUrl}`);
          
          updateData.thumbnail = cleanedUrl;
          updated = true;
        }
      }
      
      if (item.url) {
        const originalUrl = item.url;
        const cleanedUrl = cleanDuplicateExtensions(item.url);
        
        if (originalUrl !== cleanedUrl) {
          console.log(`  CMS "${item.title || item._id}":`);
          console.log(`    Before: ${originalUrl}`);
          console.log(`    After:  ${cleanedUrl}`);
          
          updateData.url = cleanedUrl;
          updated = true;
        }
      }
      
      if (updated) {
        await CMS.findByIdAndUpdate(item._id, updateData);
        cmsUpdates++;
      }
    }
    console.log(`  ✅ Updated ${cmsUpdates} CMS items\n`);

    console.log('🎉 Duplicate extension cleanup completed!');
    console.log(`Total updates: ${roomUpdates + categoryUpdates + userUpdates + cmsUpdates}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleanup
fixDuplicateExtensions();
