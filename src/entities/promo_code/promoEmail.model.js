import mongoose, { Schema } from "mongoose";

const promoEmailSchema = new Schema(
  {
    promoCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PromoCode",
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    recipients: [{
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      status: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'bounced'],
        default: 'pending',
      },
      sentAt: {
        type: Date,
        default: null,
      },
      messageId: {
        type: String,
        default: null,
      },
      errorMessage: {
        type: String,
        default: null,
      },
      retryCount: {
        type: Number,
        default: 0,
      },
    }],
    totalRecipients: {
      type: Number,
      required: true,
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'partial'],
      default: 'pending',
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
promoEmailSchema.index({ promoCode: 1, status: 1 });
promoEmailSchema.index({ 'recipients.email': 1 });
promoEmailSchema.index({ sentBy: 1, createdAt: -1 });

// Virtual for success rate
promoEmailSchema.virtual('successRate').get(function() {
  if (this.totalRecipients === 0) return 0;
  return (this.sentCount / this.totalRecipients) * 100;
});

// Method to update recipient status
promoEmailSchema.methods.updateRecipientStatus = function(email, status, messageId = null, errorMessage = null) {
  const recipient = this.recipients.find(r => r.email === email);
  if (recipient) {
    recipient.status = status;
    recipient.sentAt = status === 'sent' ? new Date() : recipient.sentAt;
    recipient.messageId = messageId;
    recipient.errorMessage = errorMessage;
    
    if (status === 'failed') {
      recipient.retryCount += 1;
    }
    
    // Update counts
    this.sentCount = this.recipients.filter(r => r.status === 'sent').length;
    this.failedCount = this.recipients.filter(r => r.status === 'failed').length;
    
    // Update overall status
    if (this.sentCount === this.totalRecipients) {
      this.status = 'completed';
      this.completedAt = new Date();
    } else if (this.failedCount === this.totalRecipients) {
      this.status = 'failed';
      this.completedAt = new Date();
    } else if (this.sentCount > 0 || this.failedCount > 0) {
      this.status = 'partial';
    }
  }
};

const PromoEmail = mongoose.model("PromoEmail", promoEmailSchema);
export default PromoEmail;
