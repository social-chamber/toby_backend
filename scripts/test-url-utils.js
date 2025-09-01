import { 
  cleanDuplicateExtensions, 
  ensureAbsoluteUrl, 
  isValidCloudinaryUrl,
  sanitizeFilename 
} from '../src/lib/urlUtils.js';

console.log('🧪 Testing URL utilities...\n');

// Test cleanDuplicateExtensions
console.log('📝 Testing cleanDuplicateExtensions:');
const testUrls = [
  'https://res.cloudinary.com/test/image/upload/v123/test.jpg.jpg',
  'https://res.cloudinary.com/test/image/upload/v123/test.mp4.mp4',
  'https://res.cloudinary.com/test/image/upload/v123/test.png.png',
  'https://res.cloudinary.com/test/image/upload/v123/test.jpg', // Should not change
  'https://res.cloudinary.com/test/image/upload/v123/test.mp4', // Should not change
];

testUrls.forEach(url => {
  const cleaned = cleanDuplicateExtensions(url);
  console.log(`  ${url}`);
  console.log(`  → ${cleaned}\n`);
});

// Test ensureAbsoluteUrl
console.log('🔗 Testing ensureAbsoluteUrl:');
const testRelativeUrls = [
  'res.cloudinary.com/test/image/upload/v123/test.jpg',
  'https://res.cloudinary.com/test/image/upload/v123/test.jpg',
  'http://res.cloudinary.com/test/image/upload/v123/test.jpg',
];

testRelativeUrls.forEach(url => {
  const absolute = ensureAbsoluteUrl(url);
  console.log(`  ${url}`);
  console.log(`  → ${absolute}\n`);
});

// Test isValidCloudinaryUrl
console.log('✅ Testing isValidCloudinaryUrl:');
const testValidationUrls = [
  'https://res.cloudinary.com/test/image/upload/v123/test.jpg',
  'https://res.cloudinary.com/test/image/upload/v123/test.mp4',
  'https://example.com/test.jpg',
  'invalid-url',
  'res.cloudinary.com/test/image/upload/v123/test.jpg',
];

testValidationUrls.forEach(url => {
  const isValid = isValidCloudinaryUrl(url);
  console.log(`  ${url} → ${isValid ? '✅ Valid' : '❌ Invalid'}`);
});

// Test sanitizeFilename
console.log('\n📁 Testing sanitizeFilename:');
const testFilenames = [
  'test file.jpg',
  'test-file.jpg',
  'test_file.jpg',
  'test@#$%^&*().jpg',
  'test file with spaces.jpg',
  'test-file-with-dashes.jpg',
];

testFilenames.forEach(filename => {
  const sanitized = sanitizeFilename(filename);
  console.log(`  "${filename}" → "${sanitized}"`);
});

console.log('\n🎉 URL utilities test completed!');
