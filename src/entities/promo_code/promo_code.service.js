import PromoCode from "./promo_code.model.js";


export const createPromoCodeService = async (data) => {
  // cleans up the code string 
  data.code = data.code.trim().toUpperCase();

  const existing = await PromoCode.findOne({ code: data.code });
  if (existing) throw new Error("Promo code already exists.");

  const promoCode = new PromoCode(data);
  return await promoCode.save();
};


export const getAllPromoCodesService = async (filter, page, limit) => {
  const skip = (page - 1) * limit;

  // Runs both queries in parallel using Promise.all() to improve performance.
  const [data, totalData] = await Promise.all([
    PromoCode.find(filter)
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    PromoCode.countDocuments(filter),
  ]);
  return { data, totalData };
};


export const getPromoCodeByIdService = async (id) => {
  return await PromoCode.findById(id).populate("createdBy", "firstName lastName email");
};


export const updatePromoCodeService = async (id, updateData) => {
  if (updateData.code) {
    updateData.code = updateData.code.trim().toUpperCase();
  }
  const updated = await PromoCode.findByIdAndUpdate(id, updateData, { new: true });
  if (!updated) throw new Error("Promo code not found");
  return updated;
};


export const deletePromoCodeService = async (id) => {
  const deleted = await PromoCode.findByIdAndDelete(id);
  if (!deleted) throw new Error("Promo code not found or already deleted");
  return deleted;
};


export const applyPromoCodeService = async (code) => {
  const promo = await PromoCode.findOne({ code: code.trim().toUpperCase() });

  if (!promo) throw new Error("Promo code not found");
  if (!promo.active) throw new Error("Promo code is inactive");

  const now = new Date();
  if (promo.expiryDate <= now) throw new Error("Promo code has expired");

  if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
    throw new Error("Promo code usage limit exceeded");
  }

  promo.usedCount += 1;
  await promo.save();

  return promo;
};



