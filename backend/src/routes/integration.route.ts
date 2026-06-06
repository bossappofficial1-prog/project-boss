import { Router } from "express";
import { integrationController } from "../controller/integration.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { requireActiveSubscription, requireSubscriptionPlan } from "../middleware/subscription.middleware";
import { UserRole } from "@prisma/client";

const integrationRouter = Router();

// Google OAuth Callback - public endpoint redirect from Google
integrationRouter.get("/google/callback", integrationController.googleCallback);

// All other endpoints require authenticated owner
integrationRouter.use(protect);
integrationRouter.use(authorize(UserRole.OWNER));
integrationRouter.use(requireActiveSubscription);

// Get connection statuses
integrationRouter.get("/", integrationController.getIntegrations);

// Google Calendar Actions
integrationRouter.get("/google/connect", integrationController.getGoogleAuthUrl);
integrationRouter.delete("/google", (req, res, next) => {
    req.params.provider = "GOOGLE_CALENDAR";
    next();
}, integrationController.disconnect);

// WhatsApp Actions - restricted to PRO and ENTERPRISE plans
integrationRouter.post(
    "/whatsapp/initiate",
    requireSubscriptionPlan(["PRO", "ENTERPRISE"]),
    integrationController.initiateWhatsApp
);

integrationRouter.get(
    "/whatsapp/status",
    requireSubscriptionPlan(["PRO", "ENTERPRISE"]),
    integrationController.getWhatsAppStatus
);

integrationRouter.delete(
    "/whatsapp",
    requireSubscriptionPlan(["PRO", "ENTERPRISE"]),
    (req, res, next) => {
        req.params.provider = "WHATSAPP";
        next();
    },
    integrationController.disconnect
);

integrationRouter.post(
    "/whatsapp/test-send",
    requireSubscriptionPlan(["PRO", "ENTERPRISE"]),
    integrationController.sendTestWhatsApp
);

export default integrationRouter;
