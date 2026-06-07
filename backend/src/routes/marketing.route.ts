import { Router } from "express";
import { marketingController } from "../controller/marketing.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { requireActiveSubscription, requireSubscriptionPlan } from "../middleware/subscription.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import { sendBroadcastSchema } from "../schemas/marketing.schema";
import { UserRole } from "@prisma/client";

const marketingRouter = Router();

marketingRouter.use(protect);
marketingRouter.use(authorize(UserRole.OWNER));
marketingRouter.use(requireActiveSubscription);
marketingRouter.use(requireSubscriptionPlan(["PRO", "ENTERPRISE"]));

marketingRouter.post("/broadcast", validateSchema(sendBroadcastSchema), marketingController.sendBroadcast);

export default marketingRouter;
