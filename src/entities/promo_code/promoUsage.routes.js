/**
 * Promo Code Usage Routes
 * API endpoints for tracking and displaying promo code usage
 */

import express from 'express';
import {
  getPromoUsageStats,
  getPromoUsageDetails,
  getPromoUsageSummary,
  getPromoCodeUsers,
  exportPromoUsageData,
  syncPromoUsageCounts
} from './promoUsage.controller.js';
import {
  verifyToken,
  adminMiddleware
} from '../../core/middlewares/authMiddleware.js';

const router = express.Router();

// All routes require authentication and admin access
router.use(verifyToken);
router.use(adminMiddleware);

/**
 * @route   GET /api/admin/promo-usage
 * @desc    Get all promo code usage statistics with filters
 * @access  Private (Admin only)
 * @query   page, limit, startDate, endDate, promoCode, sortBy, sortOrder
 */
router.get('/', getPromoUsageStats);

/**
 * @route   GET /api/admin/promo-usage/summary
 * @desc    Get promo code usage summary for dashboard
 * @access  Private (Admin only)
 * @query   period (days)
 */
router.get('/summary', getPromoUsageSummary);

/**
 * @route   POST /api/admin/promo-usage/sync
 * @desc    Sync promo code usage counts with actual booking data
 * @access  Private (Admin only)
 */
router.post('/sync', syncPromoUsageCounts);

/**
 * @route   GET /api/admin/promo-usage/export
 * @desc    Export promo code usage data to CSV
 * @access  Private (Admin only)
 * @query   startDate, endDate, promoCode
 */
router.get('/export', exportPromoUsageData);

/**
 * @route   GET /api/admin/promo-usage/:promoCodeId
 * @desc    Get detailed usage for a specific promo code
 * @access  Private (Admin only)
 * @query   page, limit
 */
router.get('/:promoCodeId', getPromoUsageDetails);

/**
 * @route   GET /api/admin/promo-usage/:promoCodeId/users
 * @desc    Get user details who used a specific promo code
 * @access  Private (Admin only)
 * @query   page, limit
 */
router.get('/:promoCodeId/users', getPromoCodeUsers);

export default router;
