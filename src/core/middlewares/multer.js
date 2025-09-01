import { resolve } from "path";
import { existsSync, mkdirSync } from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import path from "path";
import { sanitizeFilename } from "../../lib/urlUtils.js";

// Get the directory name for the ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create directories if they don't exist
const uploadDir = resolve(__dirname, "../../../uploads");
const imageDir = resolve(uploadDir, "images");
const videoDir = resolve(uploadDir, "videos");
const fileDir = resolve(uploadDir, "files");

if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
if (!existsSync(imageDir)) mkdirSync(imageDir, { recursive: true });
if (!existsSync(videoDir)) mkdirSync(videoDir, { recursive: true })
if (!existsSync(fileDir)) mkdirSync(fileDir, { recursive: true });

// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, imageDir);
    } else if (file.mimetype.startsWith("video/")) {
      cb(null, videoDir);    // for videos (and other files)
    }

    else {
      cb(null, fileDir);
    }
  },
  filename: function (req, file, cb) {
    const randomName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // Sanitize the original filename to avoid issues
    const sanitizedOriginalName = sanitizeFilename(file.originalname);
    cb(null, file.fieldname + "-" + randomName + "-" + sanitizedOriginalName);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allow images, videos, and common document types
  const allowedMimes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Create the base multer instance with file filtering
const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Custom fields upload function
const multerUpload = (fields) => upload.fields(fields);


// Export both options
export { upload, multerUpload };
