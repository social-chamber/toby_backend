import {
  createPromoCodeService,
  getAllPromoCodesService,
  getPromoCodeByIdService,
  updatePromoCodeService,
  deletePromoCodeService,
  applyPromoCodeService,
  incrementPromoUsageService,
  syncAllPromoUsageCountsService,
} from "./promo_code.service.js";
import { generateResponse } from "../../lib/responseFormate.js";
import { createFilter, createPaginationInfo } from "../../lib/pagination.js";
import emailService from "../../lib/emailService.js";
import User from "../auth/auth.model.js";
import bookingModel from "../booking/booking.model.js";
import { 
  createPromoEmailCampaign, 
  sendPromoEmailCampaign, 
  retryFailedEmails,
  getPromoEmailCampaigns,
  getPromoEmailStats 
} from "./promoEmail.service.js";


export const getPromoEmailRecipients = async (req, res) => {
  try {
    const distinctEmails = await bookingModel.distinct('user.email');
    const emails = distinctEmails.filter(Boolean).sort();
    generateResponse(res, 200, true, "Fetched promo email recipients", { emails, total: emails.length });
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch recipients", error.message);
  }
}

export const createPromoCode = async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    const promoCode = await createPromoCodeService(data);
    generateResponse(res, 201, true, "Promo code created successfully", promoCode);
  } catch (error) {
    const msg = error?.message || 'Failed to create promo code';
    const isClientError = /exists|invalid|required|usage|future|limit/i.test(msg);
    generateResponse(res, isClientError ? 400 : 500, false, msg, null);
  }
};


export const getAllPromoCodes = async (req, res) => {
  try {
    const { search, date, page = 1, limit = 10, code } = req.query;
    const filter = createFilter(search, date);
    if (code) filter.code = { $regex: code, $options: "i" };

    const { data, totalData } = await getAllPromoCodesService(filter, page, limit);
    const pagination = createPaginationInfo(Number(page), Number(limit), totalData);

    generateResponse(res, 200, true, "Fetched promo codes", { data, pagination });
  } catch (error) {
    const msg = error?.message || 'Failed to fetch promo codes';
    generateResponse(res, 500, false, msg, null);
  }
};


export const getPromoCodeById = async (req, res) => {
  try {
    const code = await getPromoCodeByIdService(req.params.id);
    if (!code) return generateResponse(res, 404, false, "Promo code not found");
    generateResponse(res, 200, true, "Fetched promo code", code);
  } catch (error) {
    const msg = error?.message || 'Failed to fetch promo code';
    const isClientError = /not found|invalid/i.test(msg);
    generateResponse(res, isClientError ? 404 : 500, false, msg, null);
  }
};


export const updatePromoCode = async (req, res) => {
  try {
    const updated = await updatePromoCodeService(req.params.id, req.body);
    generateResponse(res, 200, true, "Promo code updated successfully", updated);
  } catch (error) {
    const msg = error?.message || 'Failed to update promo code';
    const isClientError = /not found|invalid|exists|limit|future/i.test(msg);
    generateResponse(res, isClientError ? 400 : 500, false, msg, null);
  }
};


export const deletePromoCode = async (req, res) => {
  try {
    const deleted = await deletePromoCodeService(req.params.id);
    generateResponse(res, 200, true, "Promo code deleted successfully", deleted);
  } catch (error) {
    const msg = error?.message || 'Failed to delete promo code';
    const isClientError = /not found/i.test(msg);
    generateResponse(res, isClientError ? 404 : 500, false, msg, null);
  }
};


export const applyPromoCode = async (req, res) => {
  try {
    const { code } = req.body;
    const promo = await applyPromoCodeService(code);
    generateResponse(res, 200, true, "Promo code applied successfully", promo);
  } catch (error) {
    const msg = error?.message || 'Failed to apply promo code';
    const isClientError = /not found|inactive|expired|limit/i.test(msg);
    generateResponse(res, isClientError ? 400 : 500, false, msg, null);
  }
};


export const sendBulkEmailController = async (req, res) => {
  const { subject, body, promoCodeId, recipients } = req.body;

  if (!subject || !body || !promoCodeId) {
    return generateResponse(
      res,
      400,
      false,
      "Subject, body, and promoCodeId are required.",
      null
    );
  }

  try {
    // Create email campaign
    const campaign = await createPromoEmailCampaign({
      promoCodeId,
      subject,
      body,
      recipients,
      sentBy: req.user._id
    });

    // Send emails asynchronously
    sendPromoEmailCampaign(campaign._id)
      .then(result => {
        console.log(`Promo email campaign ${campaign._id} completed:`, {
          successful: result.results.successful.length,
          failed: result.results.failed.length
        });
      })
      .catch(error => {
        console.error(`Promo email campaign ${campaign._id} failed:`, error);
      });

    return generateResponse(res, 200, true, "Email campaign created and started", {
      campaignId: campaign._id,
      totalRecipients: campaign.totalRecipients,
      status: campaign.status
    });
  } catch (error) {
    const msg = error?.message || 'An unexpected error occurred while creating email campaign';
    const isClientError = /not found|no recipients|required/i.test(msg);
    return generateResponse(res, isClientError ? 400 : 500, false, msg, null);
  }
};

export const getEmailCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 10, promoCodeId } = req.query;
    const filter = promoCodeId ? { promoCode: promoCodeId } : {};
    
    const { campaigns, total } = await getPromoEmailCampaigns(filter, page, limit);
    const pagination = createPaginationInfo(Number(page), Number(limit), total);
    
    generateResponse(res, 200, true, "Email campaigns fetched successfully", {
      campaigns,
      pagination
    });
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch email campaigns", error.message);
  }
};

export const getEmailCampaignStats = async (req, res) => {
  try {
    const { promoCodeId } = req.query;
    const stats = await getPromoEmailStats(promoCodeId);
    
    generateResponse(res, 200, true, "Email campaign stats fetched successfully", stats);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch email campaign stats", error.message);
  }
};

export const retryFailedEmailsController = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { maxRetries = 3 } = req.body;
    
    const result = await retryFailedEmails(campaignId, maxRetries);
    
    generateResponse(res, 200, true, "Failed emails retry completed", result);
  } catch (error) {
    const msg = error?.message || 'Failed to retry emails';
    const isClientError = /not found/i.test(msg);
    generateResponse(res, isClientError ? 404 : 500, false, msg, null);
  }
};

// Sync all promo code usage counts
export const syncPromoUsageCounts = async (req, res) => {
  try {
    const result = await syncAllPromoUsageCountsService();
    return generateResponse(res, 200, true, "Promo usage counts synced successfully", {
      syncedCount: result.syncedCount
    });
  } catch (error) {
    const msg = error.message || "Failed to sync promo usage counts";
    generateResponse(res, 500, false, msg, null);
  }
};


