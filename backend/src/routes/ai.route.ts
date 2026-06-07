import { Router } from "express";
import { aiController } from "../controller/ai.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { requireActiveSubscription, requireSubscriptionPlan } from "../middleware/subscription.middleware";
import { UserRole } from "@prisma/client";

const aiRouter = Router();

aiRouter.use(protect);
aiRouter.use(authorize(UserRole.OWNER));
aiRouter.use(requireActiveSubscription);
aiRouter.use(requireSubscriptionPlan(["TRIAL", "PRO", "ENTERPRISE"]));

aiRouter.get("/analyze", aiController.analyze);

export default aiRouter;
