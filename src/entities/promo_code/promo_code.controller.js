import {
  createPromoCodeService,
  getAllPromoCodesService,
  getPromoCodeByIdService,
  updatePromoCodeService,
  deletePromoCodeService,
  applyPromoCodeService,
} from "./promo_code.service.js";
import { generateResponse } from "../../lib/responseFormate.js";
import { createFilter, createPaginationInfo } from "../../lib/pagination.js";
import sendEmail from "../../lib/sendEmail.js";
import User from "../auth/auth.model.js";
import bookingModel from "../booking/booking.model.js";


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
  const { subject, body, promoCode, recipients } = req.body;

  if (!subject || !body || !promoCode) {
    return generateResponse(
      res,
      400,
      "fail",
      "Subject, body, and promoCode are required.",
      null
    );
  }

  try {
    // Accept explicit recipients, otherwise fallback to distinct emails from bookings
    let targetEmails = Array.isArray(recipients) && recipients.length > 0
      ? recipients
      : await bookingModel.distinct('user.email');

    targetEmails = targetEmails.filter(Boolean);
    if (!targetEmails.length) {
      return generateResponse(res, 404, "fail", "No recipients found.", null);
    }

    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h1 style="color: #333;">${subject}</h1>
        <p style="color: #555;">Hello,</p>
        <p>${body}</p>
        <p style="color: #555;">Your promo code is: <strong>${promoCode}</strong></p>
        <p style="color: #555;">Thank you for using our service!</p>
      </div>
    `;

    // Send emails one by one (or you can use Promise.all for parallel sending)
    const sendJobs = targetEmails.map((email) =>
      sendEmail({ to: email, subject, html })
    );
    const results = await Promise.all(sendJobs);

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    return generateResponse(res, 200, "success", "Bulk email send process completed", {
      total: targetEmails.length,
      success: successCount,
      failed: failCount,
    });
  } catch (error) {
    const msg = error?.message || 'An unexpected error occurred while sending bulk emails';
    const isClientError = /no recipients|required/i.test(msg);
    return generateResponse(res, isClientError ? 400 : 500, "error", msg, null);
  }
};


