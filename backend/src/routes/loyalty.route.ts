import { Router } from "express";
import { LoyaltyController } from "../controller/loyalty.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

router.use(protect);

// ─── Config ──────────────────────────────────────────────────────────────────
router.get("/config/:outletId", asyncHandler(LoyaltyController.getConfig));
router.put("/config/:outletId", authorize(UserRole.OWNER), asyncHandler(LoyaltyController.upsertConfig));

// ─── Tiers ───────────────────────────────────────────────────────────────────
router.get("/tiers/:outletId", asyncHandler(LoyaltyController.getTiers));
router.post("/tiers/:outletId", authorize(UserRole.OWNER), asyncHandler(LoyaltyController.createTier));
router.put("/tiers/:outletId/:tierId", authorize(UserRole.OWNER), asyncHandler(LoyaltyController.updateTier));
router.delete("/tiers/:outletId/:tierId", authorize(UserRole.OWNER), asyncHandler(LoyaltyController.deleteTier));

// ─── Rewards ─────────────────────────────────────────────────────────────────
router.get("/rewards/:outletId", asyncHandler(LoyaltyController.getRewards));
router.post("/rewards/:outletId", authorize(UserRole.OWNER), asyncHandler(LoyaltyController.createReward));
router.put("/rewards/:outletId/:rewardId", authorize(UserRole.OWNER), asyncHandler(LoyaltyController.updateReward));
router.delete("/rewards/:outletId/:rewardId", authorize(UserRole.OWNER), asyncHandler(LoyaltyController.deleteReward));
router.post("/rewards/:outletId/redeem", asyncHandler(LoyaltyController.redeemReward));

// ─── Members ─────────────────────────────────────────────────────────────────
router.get("/members/:outletId", asyncHandler(LoyaltyController.getMembers));
router.post("/register", asyncHandler(LoyaltyController.registerMember));
router.post(
  "/members/:outletId/:guestCustomerId/adjust-points",
  authorize(UserRole.OWNER),
  asyncHandler(LoyaltyController.adjustPoints),
);
router.get(
  "/members/:outletId/:guestCustomerId/history",
  authorize(UserRole.OWNER),
  asyncHandler(LoyaltyController.getPointHistory),
);
router.get(
  "/members/:outletId/:guestCustomerId/redemptions",
  authorize(UserRole.OWNER),
  asyncHandler(LoyaltyController.getMemberRedemptions),
);

export default router;
