import express from "express";
import {
  createPromoCode,
  deletePromoCode,
  getAllPromoCodes,
  getPromoCodeById,
  updatePromoCode,
  applyPromoCode,
  sendBulkEmailController,
  getPromoEmailRecipients,
} from "./promo_code.controller.js";
import { adminMiddleware, verifyToken } from "../../core/middlewares/authMiddleware.js";


const router = express.Router();

// Public
router.get("/", getAllPromoCodes);
router.get("/:id", getPromoCodeById);
router.post("/apply", applyPromoCode); 

// Admin only
router.post("/", verifyToken, adminMiddleware, createPromoCode);
router.put("/:id", verifyToken, adminMiddleware, updatePromoCode);
router.delete("/:id", verifyToken, adminMiddleware, deletePromoCode);

// email
router.get('/recipients', verifyToken, adminMiddleware, getPromoEmailRecipients);
router.post('/send', verifyToken, adminMiddleware, sendBulkEmailController);

export default router;
