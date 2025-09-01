#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧹 Starting comprehensive backend cleanup...\n');

try {
  // Step 1: Fix duplicate extensions
  console.log('📝 Step 1: Fixing duplicate file extensions...');
  execSync('node scripts/fix-duplicate-extensions.js', { 
    cwd: __dirname + '/..',
    stdio: 'inherit' 
  });
  
  console.log('\n✅ Duplicate extensions fixed!\n');
  
  // Step 2: Check for missing files
  console.log('🔍 Step 2: Checking for missing files...');
  execSync('node scripts/upload-missing-files.js', { 
    cwd: __dirname + '/..',
    stdio: 'inherit' 
  });
  
  console.log('\n✅ File check completed!\n');
  
  console.log('🎉 All cleanup operations completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('  1. Review any broken URLs reported above');
  console.log('  2. Upload missing files to Cloudinary if needed');
  console.log('  3. Restart your backend server');
  console.log('  4. Test your frontend - images should now load properly');
  
} catch (error) {
  console.error('\n❌ Error during cleanup:', error.message);
  process.exit(1);
}
