import { z } from "zod";

// ─── LoyaltyConfig ────────────────────────────────────────────────────────────
export const upsertLoyaltyConfigSchema = z.object({
  pointsEarned: z.number().int().min(0).default(1),
  multiplierAmount: z.number().positive().default(10000),
  minSpending: z.number().min(0).default(0),
  pointValue: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  autoEnroll: z.boolean().default(true),
  welcomeBonus: z.number().int().min(0).default(0),
  maxRedeemPercent: z.number().min(0).max(100).default(100),
  expiryDays: z.number().int().min(1).nullable().optional(),
  minRedeemPoints: z.number().int().min(1).default(1),
});

// ─── LoyaltyTier ──────────────────────────────────────────────────────────────
export const createLoyaltyTierSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Format warna harus hex (#RRGGBB)").default("#CD7F32"),
  minLifetimePoints: z.number().int().min(0).default(0),
  earnMultiplier: z.number().min(0.1).max(10).default(1.0),
  sortOrder: z.number().int().min(0).default(0),
  benefits: z.string().max(500).optional(),
});

export const updateLoyaltyTierSchema = createLoyaltyTierSchema.partial();

// ─── LoyaltyReward ────────────────────────────────────────────────────────────
export const createLoyaltyRewardSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  type: z.enum(["DISCOUNT_FLAT", "DISCOUNT_PERCENT", "FREE_ITEM", "VOUCHER", "CASHBACK"]),
  pointsCost: z.number().int().min(1),
  // Type-specific
  discountAmount: z.number().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  maxDiscount: z.number().min(0).optional(),
  productId: z.string().uuid().optional(),
  voucherValue: z.number().min(0).optional(),
  cashbackAmount: z.number().min(0).optional(),
  // Availability
  stock: z.number().int().min(-1).default(-1),
  isActive: z.boolean().default(true),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "DISCOUNT_FLAT" && !data.discountAmount) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "discountAmount wajib untuk tipe DISCOUNT_FLAT", path: ["discountAmount"] });
  }
  if (data.type === "DISCOUNT_PERCENT" && !data.discountPercent) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "discountPercent wajib untuk tipe DISCOUNT_PERCENT", path: ["discountPercent"] });
  }
  if (data.type === "FREE_ITEM" && !data.productId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "productId wajib untuk tipe FREE_ITEM", path: ["productId"] });
  }
  if (data.type === "VOUCHER" && !data.voucherValue) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "voucherValue wajib untuk tipe VOUCHER", path: ["voucherValue"] });
  }
  if (data.type === "CASHBACK" && !data.cashbackAmount) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "cashbackAmount wajib untuk tipe CASHBACK", path: ["cashbackAmount"] });
  }
});

export const updateLoyaltyRewardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  type: z.enum(["DISCOUNT_FLAT", "DISCOUNT_PERCENT", "FREE_ITEM", "VOUCHER", "CASHBACK"]).optional(),
  pointsCost: z.number().int().min(1).optional(),
  discountAmount: z.number().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  maxDiscount: z.number().min(0).optional(),
  productId: z.string().uuid().optional(),
  voucherValue: z.number().min(0).optional(),
  cashbackAmount: z.number().min(0).optional(),
  stock: z.number().int().min(-1).optional(),
  isActive: z.boolean().optional(),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "DISCOUNT_FLAT" && !data.discountAmount) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "discountAmount wajib untuk tipe DISCOUNT_FLAT", path: ["discountAmount"] });
  }
  if (data.type === "DISCOUNT_PERCENT" && !data.discountPercent) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "discountPercent wajib untuk tipe DISCOUNT_PERCENT", path: ["discountPercent"] });
  }
  if (data.type === "FREE_ITEM" && !data.productId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "productId wajib untuk tipe FREE_ITEM", path: ["productId"] });
  }
  if (data.type === "VOUCHER" && !data.voucherValue) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "voucherValue wajib untuk tipe VOUCHER", path: ["voucherValue"] });
  }
  if (data.type === "CASHBACK" && !data.cashbackAmount) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "cashbackAmount wajib untuk tipe CASHBACK", path: ["cashbackAmount"] });
  }
});


// ─── Redemption ───────────────────────────────────────────────────────────────
export const redeemRewardSchema = z.object({
  loyaltyRewardId: z.string().uuid(),
  guestCustomerId: z.string().uuid(),
  orderId: z.string().optional(),
});

// ─── Membership ───────────────────────────────────────────────────────────────
export const registerMembershipSchema = z.object({
  guestCustomerId: z.string().uuid().optional(),
  outletId: z.string(),
  name: z.string().optional(),
  phone: z.string().optional(),
});

export const getMembersByOutletQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tier: z.string().optional(),
  sortBy: z.enum(["points", "spending", "joinedAt", "lifetimePoints"]).default("joinedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const getPointHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const adjustPointsSchema = z.object({
  points: z.number().int(),
  note: z.string().max(200).optional(),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type UpsertLoyaltyConfigInput = z.infer<typeof upsertLoyaltyConfigSchema>;
export type CreateLoyaltyTierInput = z.infer<typeof createLoyaltyTierSchema>;
export type UpdateLoyaltyTierInput = z.infer<typeof updateLoyaltyTierSchema>;
export type CreateLoyaltyRewardInput = z.infer<typeof createLoyaltyRewardSchema>;
export type UpdateLoyaltyRewardInput = z.infer<typeof updateLoyaltyRewardSchema>;
export type RedeemRewardInput = z.infer<typeof redeemRewardSchema>;
export type RegisterMembershipInput = z.infer<typeof registerMembershipSchema>;
export type GetMembersByOutletQuery = z.infer<typeof getMembersByOutletQuerySchema>;
export type GetPointHistoryQuery = z.infer<typeof getPointHistoryQuerySchema>;
export type AdjustPointsInput = z.infer<typeof adjustPointsSchema>;
