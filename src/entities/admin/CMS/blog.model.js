import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  thumbnail: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Blog", blogSchema);
