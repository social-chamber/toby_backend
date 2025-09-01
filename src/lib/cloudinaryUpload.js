import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { cloudinaryApiKey, cloudinaryCloudName, cloudinarySecret } from "../core/config/config.js";
import { sanitizeFilename } from "./urlUtils.js";

cloudinary.config({
  cloud_name: cloudinaryCloudName,
  api_key: cloudinaryApiKey,
  api_secret: cloudinarySecret,
});

export const cloudinaryUpload = async (filePath, public_id, folder) => {
  try {
    // Sanitize the public_id to avoid any naming issues
    const sanitizedPublicId = sanitizeFilename(public_id);
    
    const uploadImage = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
      public_id: sanitizedPublicId,
      folder,
      // Ensure we get secure URLs
      secure: true,
      // Add transformation to ensure consistent format
      transformation: [
        { quality: "auto" },
        { fetch_format: "auto" }
      ]
    });
    
    // Clean up local file
    fs.unlinkSync(filePath);
    
    // Ensure we return the secure URL
    return {
      ...uploadImage,
      secure_url: uploadImage.secure_url || uploadImage.url
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    // Clean up local file even on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return "file upload failed";
  }
};

export const cloudinaryDelete = async (public_id) => {
  try {
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: "auto", // Use auto to handle both images and videos
    });

    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return null;
  }
};

export default cloudinary;
