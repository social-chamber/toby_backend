import PromoCode from '../promo_code/promo_code.model.js';
import { incrementPromoUsageService } from '../promo_code/promo_code.service.js';
import Booking from './booking.model.js';
import Service from '../admin/Services/createServices.model.js';
import Category from '../category/category.model.js';
import { slotGenerator } from '../../lib/slotGenerator.js';
import { createPaginationInfo } from '../../lib/pagination.js';

export const createBookingService = async (data) => {
    const {
        user,
        date,
        timeSlots,
        service: serviceId,
        room: roomId,
        promoCode,
        numberOfPeople,
    } = data;

    // Validate date
    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) throw new Error('Invalid date');

    const service = await Service.findById(serviceId);
    if (!service) throw new Error('Service not found');

    // STEP 1: Check if selected slots are still available
    const { slots: availableSlots } = await checkAvailabilityService(date, serviceId, roomId);

    for (let requestedSlot of timeSlots) {
        const match = availableSlots.find(
            slot =>
                slot.start === requestedSlot.start &&
                slot.end === requestedSlot.end &&
                slot.available === true
        );
        if (!match) {
            const e = new Error(`Slot ${requestedSlot.start} - ${requestedSlot.end} is no longer available.`);
            e.statusCode = 409;
            e.code = 'SLOT_CONFLICT';
            throw e;
        }
    }

    // ADDITIONAL SAFETY CHECK: Double-verify no confirmed bookings exist for these exact time slots
    const safetyCheckDate = new Date(date);
    const safetyStartOfDay = new Date(safetyCheckDate);
    safetyStartOfDay.setHours(0, 0, 0, 0);
    const safetyEndOfDay = new Date(safetyCheckDate);
    safetyEndOfDay.setHours(23, 59, 59, 999);

    const conflictingBookings = await Booking.find({
        date: { $gte: safetyStartOfDay, $lte: safetyEndOfDay },
        room: roomId,
        status: 'confirmed',
        timeSlots: {
            $elemMatch: {
                $or: timeSlots.map(slot => ({
                    start: slot.start,
                    end: slot.end
                }))
            }
        }
    });

    if (conflictingBookings.length > 0) {
        const e = new Error(`Time slots are already booked by confirmed reservations. Please select different times.`);
        e.statusCode = 409;
        e.code = 'SLOT_CONFLICT';
        throw e;
    }

    // STEP 2: Calculate total price based on number of people
    // IMPORTANT: Match frontend pricing logic (+$1 per slot)
    const pricePerSlot = (service.pricePerSlot || 0) + 1; // Add $1 to match frontend display
    let total = pricePerSlot * timeSlots.length * numberOfPeople;

    // STEP 3: Apply promo code if applicable
    let appliedPromo = null;
    if (promoCode) {
        const promo = await PromoCode.findOne({ code: promoCode, active: true });
        if (!promo) throw new Error('Invalid promo code');

        if (promo.expiryDate && promo.expiryDate < new Date()) {
            throw new Error('Promo code expired');
        }

        // Check usage limit before applying
        if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
            throw new Error('Promo code usage limit exceeded');
        }

        const discountType = typeof promo.discountType === 'string' ? promo.discountType.toLowerCase() : '';
        if (discountType === 'percentage') {
            total = total - total * (promo.discountValue / 100);
        } else if (discountType === 'fixed') {
            total = total - promo.discountValue;
        }

        if (total < 0) total = 0;
        appliedPromo = promo._id;
    }

    // STEP 4: Check and apply free slot logic
    // -----------------------------

    // Count how many confirmed bookings user already has (excluding cancelled/refunded)
    const finalizedBookingCount = await Booking.countDocuments({
        'user.email': user.email.toLowerCase(),
        status: 'confirmed'
    });

    // Calculate how many free slots user should have earned
    const freeSlotsShouldHave = Math.floor(finalizedBookingCount / 10);

    // Get how many free slots user was awarded in previous bookings
    // We find the latest booking with freeSlotsAwarded to get the number
    const latestBooking = await Booking.findOne({ 'user.email': user.email.toLowerCase() })
        .sort({ createdAt: -1 });

    const freeSlotsAwarded = latestBooking?.freeSlotsAwarded || 0;

    // If user should have more free slots than awarded, apply free booking now
    if (freeSlotsShouldHave > freeSlotsAwarded) {
        // Apply discount for only one slot
        const discount = service.pricePerSlot;
        total = Math.max(0, total - discount);
    }
    total = parseFloat(total.toFixed(2));

    // STEP 5: Create Booking
    const booking = await Booking.create({
        user: {
            ...user,
            numberOfPeople
        },
        date: bookingDate,
        timeSlots,
        service: serviceId,
        room: roomId,
        total,
        status: 'pending',
        paymentStatus: 'pending',
        promoCode: appliedPromo || undefined,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        freeSlotsAwarded: freeSlotsShouldHave > freeSlotsAwarded ? freeSlotsAwarded + 1 : freeSlotsAwarded
    });

    // Note: Promo code usage count is incremented in the payment webhook when payment is successful
    // This prevents double counting and ensures usage is only counted for paid bookings

    // Send booking creation email
    try {
        const { default: emailService } = await import('../../lib/emailService.js');
        const { bookingCreationTemplate } = await import('../../lib/emailTemplates.js');
        
        const formatDate = (date) => {
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };

        const emailHtml = bookingCreationTemplate({
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            category: service?.category?.name || 'N/A',
            room: booking.room?.title || booking.room?.name || 'N/A',
            service: service?.name || 'N/A',
            time: timeSlots || [],
            bookingId: booking._id,
            date: formatDate(booking.date)
        });

        const emailResult = await emailService.sendEmailWithRetry({
            to: user.email,
            subject: 'Booking Created - Payment Pending | Toby',
            html: emailHtml,
            priority: 'high'
        });

        if (emailResult.success) {
            booking.creationEmailSentAt = new Date();
            booking.creationEmailMessageId = emailResult.messageId;
            await booking.save();
            console.log(`✅ Booking creation email sent for booking ${booking._id} to ${user.email}`);
        } else {
            console.error(`❌ Failed to send booking creation email for booking ${booking._id}:`, emailResult.error);
        }
    } catch (error) {
        console.error('❌ Error sending booking creation email:', error.message);
        // Don't fail booking creation if email fails
    }

    return booking;
};

export const getBookingById = async (id) => {
    const booking = await Booking.findById(id)
        .populate({
            path: 'service',
            populate: {
                path: 'category',
                model: 'Category'
            }
        })
        .populate('room')
        .populate('promoCode');

    if (!booking) throw new Error('Booking not found');
    return booking;
};

// search bookings by date range and status

const isValidDate = (dateStr) => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
};

const isValidStatus = (status) => {
    return ['confirmed', 'cancelled', 'refunded'].includes(status);
};

export const getAllBookings = async ({ startDate, endDate, status } = {}, { page = 1, limit = 10 } = {}) => {
    const query = {};

    // Handle date range filtering
    if (startDate || endDate) {
        if (startDate && !isValidDate(startDate)) throw new Error("Invalid startDate format.");
        if (endDate && !isValidDate(endDate)) throw new Error("Invalid endDate format.");

        query.date = {};

        if (startDate) {
            const start = new Date(startDate);
            start.setUTCHours(0, 0, 0, 0);
            query.date.$gte = start;
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999);
            query.date.$lte = end;
        }
    }
    // By default include all statuses so admins can see newly created (pending) bookings too

    // Handle status filtering
    if (status) {
        if (!isValidStatus(status)) throw new Error("Invalid booking status.");
        query.status = status;
    }

    const skip = (page - 1) * limit;

    const [totalData, bookings] = await Promise.all([
        Booking.countDocuments(query),
        Booking.find(query)
            .populate('room')
            .populate({
                path: 'service',
                populate: {
                    path: 'category',
                    model: 'Category'
                }
            })
            .populate('promoCode')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
    ]);

    const pagination = createPaginationInfo(page, limit, totalData);

    return {
        bookings,
        pagination,
    };
};

export const updateBooking = async (id, status, reason = null) => {
    const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'refunded'];
    if (!allowedStatuses.includes(status)) {
        throw new Error(`Invalid status. Allowed values are: ${allowedStatuses.join(', ')}`);
    }

    // First, get the booking with populated data for email
    const booking = await Booking.findById(id)
        .populate('room')
        .populate({
            path: 'service',
            populate: {
                path: 'category',
                model: 'Category'
            }
        })
        .populate('promoCode');

    if (!booking) throw new Error("Booking not found or update failed");

    // Optionally, update the status and reason if needed
    booking.status = status;
    if (reason) {
        booking.holdReleaseReason = reason;
    }
    await booking.save();

    return booking;
};

export const deleteBooking = async (id) => {
    const deleted = await Booking.findByIdAndDelete(id);
    if (!deleted) throw new Error('Booking not found or already deleted');
    return true;
};

function timeToMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    if (t === "00:00") return 1440;
    return h * 60 + m;
}

// generating time slots and checking the time slots are available or not
export const checkAvailabilityService = async (date, serviceId, roomId) => {
    const service = await Service.findById(serviceId);
    if (!service) throw new Error('Service not found');

    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) throw new Error('Invalid date');

    const weekday = bookingDate.toLocaleDateString('en-SG', { weekday: 'short' });

    // If service is not available on this day, return a signal to the controller
    if (!service.availableDays.includes(weekday)) {
        return { available: false, slots: [], weekday };
    }

    // Determine slot generation behavior
    let generatorSlotDurationHours = service.slotDurationHours;
    let generatorStepMinutes = 60;

    // Compute the full time window in minutes
    const startTime = service.timeRange.start;
    const endTime = service.timeRange.end;
    const startMinsLocal = timeToMinutes(startTime);
    let endMinsLocal = timeToMinutes(endTime);
    if (endMinsLocal <= startMinsLocal) {
        endMinsLocal += 1440;
    }
    const totalRangeMins = endMinsLocal - startMinsLocal;

    // If service is in the Packages category, force a single slot covering the entire time window
    const category = await Category.findById(service.category);
    const isPackagesCategory = category?.name === 'Packages';
    if (isPackagesCategory) {
        generatorSlotDurationHours = totalRangeMins / 60;
        generatorStepMinutes = totalRangeMins;
    }

    const slots = slotGenerator(
        date,
        service.timeRange.start,
        service.timeRange.end,
        generatorSlotDurationHours,
        generatorStepMinutes,
    );

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Prevent cross-category clashes by checking all bookings for the same room on the date
    const existingBookings = await Booking.find({
        date: { $gte: startOfDay, $lte: endOfDay },
        room: roomId,
        status: { $in: ['pending', 'confirmed'] }
    });

    if (existingBookings.length === 0) {
        return { available: true, slots: slots.map(slot => ({ ...slot, available: true })) };
    }

    const bookedSlots = existingBookings.flatMap(b => b.timeSlots);

    const availableSlots = slots.map(slot => {
        const slotStartMin = timeToMinutes(slot.start);
        const slotEndMin = timeToMinutes(slot.end);

        const isBooked = bookedSlots.some(b => {
            const bookedStartMin = timeToMinutes(b.start);
            const bookedEndMin = timeToMinutes(b.end);
            return slotStartMin < bookedEndMin && slotEndMin > bookedStartMin;
        });

        return { ...slot, available: !isBooked };
    });

    return { available: true, slots: availableSlots };
};