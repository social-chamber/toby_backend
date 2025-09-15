import mongoose, { Schema } from "mongoose";

const promoCodeSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    discountType: {
      type: String,
      enum: ["Percentage", "Fixed"],
      required: true,
      default: "Percentage",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Track actual usage from bookings for verification
    actualUsageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);


// Validate expiry date
promoCodeSchema.pre("save", function (next) {
  if (this.expiryDate <= new Date()) {
    return next(new Error("Expiration date must be in the future"));
  }
  next();
});


// Validate usage limit
promoCodeSchema.pre("save", function (next) {
  if (this.usageLimit < this.usedCount) {
    return next(new Error("Usage limit cannot be less than the number of times used"));
  }
  next();
});

// Method to automatically sync usage counts
promoCodeSchema.methods.syncUsageCounts = async function() {
  const Booking = mongoose.model('Booking');
  const actualCount = await Booking.countDocuments({ 
    promoCode: this._id, 
    status: 'confirmed' 
  });
  
  this.usedCount = actualCount;
  this.usageCount = actualCount;
  this.actualUsageCount = actualCount;
  
  return this.save();
};

// Static method to sync all promo codes
promoCodeSchema.statics.syncAllUsageCounts = async function() {
  const Booking = mongoose.model('Booking');
  const promoCodes = await this.find({});
  
  for (const promo of promoCodes) {
    const actualCount = await Booking.countDocuments({ 
      promoCode: promo._id, 
      status: 'confirmed' 
    });
    
    await this.findByIdAndUpdate(promo._id, {
      usedCount: actualCount,
      usageCount: actualCount,
      actualUsageCount: actualCount
    });
  }
  
  return promoCodes.length;
};


// Index for faster search
promoCodeSchema.index({ code: 1 });

const PromoCode = mongoose.model("PromoCode", promoCodeSchema);
export default PromoCode;
