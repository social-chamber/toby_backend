/**
 * Promo Code Usage Controller
 * Handles API endpoints for tracking and displaying promo code usage
 */

import { getPromoCodeUsageStats, getPromoCodeUsageDetails } from '../../lib/promoCodeNotificationService.js';
import PromoCode from './promo_code.model.js';
import Booking from '../booking/booking.model.js';
import { createPaginationInfo } from '../../lib/pagination.js';

/**
 * Get all promo code usage statistics with filters
 * GET /api/admin/promo-usage
 */
export const getPromoUsageStats = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate, 
      promoCode,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      });
    }

    // Build filters
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (promoCode) filters.promoCode = promoCode;

    const pagination = { page: pageNum, limit: limitNum };

    const result = await getPromoCodeUsageStats(filters, pagination);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Promo code usage statistics retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting promo usage stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve promo code usage statistics',
      error: error.message
    });
  }
};

/**
 * Get detailed usage for a specific promo code
 * GET /api/admin/promo-usage/:promoCodeId
 */
export const getPromoUsageDetails = async (req, res) => {
  try {
    const { promoCodeId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      });
    }

    const pagination = { page: pageNum, limit: limitNum };

    const result = await getPromoCodeUsageDetails(promoCodeId, pagination);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Promo code usage details retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting promo usage details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve promo code usage details',
      error: error.message
    });
  }
};

/**
 * Get promo code usage summary for dashboard
 * GET /api/admin/promo-usage/summary
 */
export const getPromoUsageSummary = async (req, res) => {
  try {
    const { period = '30' } = req.query; // Default to last 30 days
    const days = parseInt(period);
    
    if (days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period. Must be between 1 and 365 days'
      });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Sync usage counts before getting promo codes
    await PromoCode.syncAllUsageCounts();
    
    // Get all promo codes with usage stats
    const promoCodes = await PromoCode.find({ active: true })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Get usage statistics for the period
    const usageStats = await Booking.aggregate([
      {
        $match: {
          promoCode: { $exists: true, $ne: null },
          status: 'confirmed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'promocodes',
          localField: 'promoCode',
          foreignField: '_id',
          as: 'promoCodeData'
        }
      },
      {
        $unwind: '$promoCodeData'
      },
      {
        $group: {
          _id: '$promoCode',
          promoCode: { $first: '$promoCodeData.code' },
          usageCount: { $sum: 1 },
          totalSavings: { $sum: '$total' }, // This would need to be calculated properly
          lastUsed: { $max: '$createdAt' },
          users: { $addToSet: '$user.email' }
        }
      },
      {
        $project: {
          promoCode: 1,
          usageCount: 1,
          totalSavings: 1,
          lastUsed: 1,
          uniqueUsers: { $size: '$users' }
        }
      },
      {
        $sort: { usageCount: -1 }
      }
    ]);

    // Get overall statistics
    const totalPromoCodes = promoCodes.length;
    const activePromoCodes = promoCodes.filter(p => p.active).length;
    const totalUsage = usageStats.reduce((sum, stat) => sum + stat.usageCount, 0);
    const totalSavings = usageStats.reduce((sum, stat) => sum + stat.totalSavings, 0);

    res.status(200).json({
      success: true,
      data: {
        period: `${days} days`,
        summary: {
          totalPromoCodes,
          activePromoCodes,
          totalUsage,
          totalSavings: totalSavings.toFixed(2),
          uniqueUsers: new Set(usageStats.flatMap(s => s.users)).size
        },
        topPromoCodes: usageStats.slice(0, 10), // Top 10 most used
        allPromoCodes: promoCodes.map(promo => ({
          _id: promo._id,
          code: promo.code,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          usedCount: promo.usedCount,
          usageLimit: promo.usageLimit,
          expiryDate: promo.expiryDate,
          active: promo.active,
          createdBy: promo.createdBy
        }))
      },
      message: 'Promo code usage summary retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting promo usage summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve promo code usage summary',
      error: error.message
    });
  }
};

/**
 * Get user details who used a specific promo code
 * GET /api/admin/promo-usage/:promoCodeId/users
 */
export const getPromoCodeUsers = async (req, res) => {
  try {
    const { promoCodeId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      });
    }

    const skip = (pageNum - 1) * limitNum;

    // Get unique users who used this promo code
    const users = await Booking.aggregate([
      {
        $match: {
          promoCode: promoCodeId,
          status: 'confirmed'
        }
      },
      {
        $group: {
          _id: '$user.email',
          firstName: { $first: '$user.firstName' },
          lastName: { $first: '$user.lastName' },
          phone: { $first: '$user.phone' },
          usageCount: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          firstUsed: { $min: '$createdAt' },
          lastUsed: { $max: '$createdAt' },
          bookings: { $push: '$_id' }
        }
      },
      {
        $sort: { lastUsed: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limitNum
      }
    ]);

    const totalUsers = await Booking.distinct('user.email', {
      promoCode: promoCodeId,
      status: 'confirmed'
    });

    res.status(200).json({
      success: true,
      data: {
        users: users.map(user => ({
          email: user._id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          phone: user.phone,
          usageCount: user.usageCount,
          totalSpent: user.totalSpent.toFixed(2),
          firstUsed: user.firstUsed,
          lastUsed: user.lastUsed,
          bookingIds: user.bookings
        })),
        totalUsers: totalUsers.length,
        pagination: createPaginationInfo(pageNum, limitNum, totalUsers.length)
      },
      message: 'Promo code users retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error getting promo code users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve promo code users',
      error: error.message
    });
  }
};

/**
 * Sync promo code usage counts
 * POST /api/admin/promo-usage/sync
 */
export const syncPromoUsageCounts = async (req, res) => {
  try {
    const syncedCount = await PromoCode.syncAllUsageCounts();
    
    res.status(200).json({
      success: true,
      message: `Successfully synced ${syncedCount} promo codes`,
      data: { syncedCount }
    });
  } catch (error) {
    console.error('❌ Error syncing promo usage counts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync promo code usage counts',
      error: error.message
    });
  }
};

/**
 * Export promo code usage data to CSV
 * GET /api/admin/promo-usage/export
 */
export const exportPromoUsageData = async (req, res) => {
  try {
    const { startDate, endDate, promoCode } = req.query;

    // Build query
    const query = {
      promoCode: { $exists: true, $ne: null },
      status: 'confirmed'
    };

    if (startDate || endDate) {
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

    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode });
      if (promo) {
        query.promoCode = promo._id;
      }
    }

    // Get all matching bookings
    const bookings = await Booking.find(query)
      .populate('service', 'name')
      .populate('room', 'title name')
      .populate('promoCode', 'code discountType discountValue')
      .sort({ createdAt: -1 });

    // Generate CSV data
    const csvData = [
      [
        'Booking ID',
        'Customer Name',
        'Customer Email',
        'Customer Phone',
        'Promo Code',
        'Discount Type',
        'Discount Value',
        'Service',
        'Room',
        'Booking Date',
        'Time Slots',
        'Total Amount',
        'Promo Email Status',
        'Promo Email Sent At',
        'Created At'
      ]
    ];

    bookings.forEach(booking => {
      csvData.push([
        booking._id.toString(),
        `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim(),
        booking.user.email || '',
        booking.user.phone || '',
        booking.promoCode?.code || '',
        booking.promoCode?.discountType || '',
        booking.promoCode?.discountValue || '',
        booking.service?.name || '',
        booking.room?.title || booking.room?.name || '',
        booking.date.toISOString().split('T')[0],
        booking.timeSlots?.map(slot => `${slot.start}-${slot.end}`).join(', ') || '',
        booking.total || '',
        booking.promoCodeEmailStatus || 'not_sent',
        booking.promoCodeEmailSentAt ? booking.promoCodeEmailSentAt.toISOString() : '',
        booking.createdAt.toISOString()
      ]);
    });

    // Convert to CSV string
    const csvString = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="promo-usage-${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.status(200).send(csvString);

  } catch (error) {
    console.error('❌ Error exporting promo usage data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export promo code usage data',
      error: error.message
    });
  }
};
