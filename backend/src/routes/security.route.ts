import { Router } from "express";
import { getGuestOrderSecurityReport, blockGuestCustomer } from "../controller/security.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";

const securityRouter = Router();

// Protect all security routes - only for admin/owner
securityRouter.use(protect);
securityRouter.use(authorize(UserRole.OWNER));

// Get security report for guest orders
securityRouter.get("/guest-orders", getGuestOrderSecurityReport);

// Block suspicious guest customer
securityRouter.post("/block-guest", blockGuestCustomer);

export default securityRouter;
