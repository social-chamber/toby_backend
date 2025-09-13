import mongoose, { Schema } from 'mongoose';

const bookingSchema = new Schema({
    user: {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        phone: { type: String, required: true, trim: true },
        numberOfPeople: { type: Number, required: true, min: 1 }
    },
    room: {
        type: Schema.Types.ObjectId,
        ref: "Room",
        required: true
    },
    promoCode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PromoCode',
        default: null
    },
    date: {
        type: Date,
        required: true
    },
    timeSlots: [
        {
            start: { type: String, required: true },
            end: { type: String, required: true }
        }
    ],
    service: {
        type: Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'hold', 'confirmed', 'cancelled','refunded'],
        default: 'pending'
    },
    stripeSessionId: {
        type: String,
        default: null,
    },
    refundId: {
        type: String,
        default: null
    },
    refundedAt: {
        type: Date,
        default: null,
    },
    paymentIntentId: { type: String, default: null },
    expiresAt: {
        type: Date,
        default: null,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
    },
    freeSlotsAwarded: { type: Number, default: 0 },
    isManualBooking: { type: Boolean, default: false },
    confirmationEmailSentAt: { type: Date, default: null },
    confirmationEmailMessageId: { type: String, default: null },
    cancelledEmailSentAt: { type: Date, default: null },
    cancelledEmailMessageId: { type: String, default: null },
    refundedEmailSentAt: { type: Date, default: null },
    refundedEmailMessageId: { type: String, default: null },
    creationEmailSentAt: { type: Date, default: null },
    creationEmailMessageId: { type: String, default: null },
    paymentFailedEmailSentAt: { type: Date, default: null },
    paymentFailedEmailMessageId: { type: String, default: null },
    priceAtCheckout: { type: Number, default: null }, // Store price snapshot at checkout
    originalServicePrice: { type: Number, default: null }, // Store original service pricePerSlot
    priceCalculationMethod: { type: String, default: 'current' }, // 'current' or 'legacy'
    pricingDiscrepancy: { type: Number, default: 0 }, // Track any pricing discrepancies
    holdExpiresAt: { type: Date, default: null },
    holdCreatedAt: { type: Date, default: null },
    holdReleasedAt: { type: Date, default: null },
    holdReleaseReason: { type: String, default: null },
    confirmedAt: { type: Date, default: null }
}, 
{
    timestamps: true
});


export default mongoose.model("Booking", bookingSchema);
