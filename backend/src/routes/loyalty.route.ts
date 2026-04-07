import { Router } from "express";
import { LoyaltyController } from "../controller/loyalty.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";

const router = Router();

// Middleware: Semua endpoint loyalty membutuhkan autentikasi
router.use(protect);

// Endpoint untuk konfigurasi loyalty (Hanya Owner)
router.get("/config/:outletId", authorize(UserRole.OWNER), LoyaltyController.getConfig);
router.put("/config/:outletId", authorize(UserRole.OWNER), LoyaltyController.upsertConfig);

// Endpoint untuk manajemen membership (Owner & Staff/Kasir)
router.get("/members/:outletId", LoyaltyController.getMembers);
router.post("/register", LoyaltyController.registerMember);
router.post("/members/:outletId/:guestCustomerId/adjust-points", authorize(UserRole.OWNER), LoyaltyController.adjustPoints);

export default router;
