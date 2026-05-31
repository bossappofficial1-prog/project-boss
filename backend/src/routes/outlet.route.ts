import { Router } from "express";
import { outletController } from "../controller/outlet.controller";
import {
    createTransferRequestController,
    acceptTransferRequestController,
    rejectTransferRequestController,
    cancelTransferRequestController,
    getIncomingTransfersController,
    getOutgoingTransfersController
} from "../controller/outlet-transfer.controller";
import { validateSchema } from "../middleware/zod.middleware";
import { createOutletSchema, updateOutletSchema, updateOutletLocationSchema } from "../schemas/outlet.schema";
import { authorize, protect } from "../middleware/auth.middleware";
import { requireActiveSubscription } from "../middleware/subscription.middleware";
import { UserRole } from "@prisma/client";

const outletRouter = Router();

// Rute Publik
outletRouter.get("/", outletController.getAll);
outletRouter.get("/featured", outletController.getFeatured);
outletRouter.get("/nearby", outletController.findNearbyOutlets);
outletRouter.get("/map", outletController.findOutletsInViewport);
outletRouter.get("/slugs", outletController.getSlugs);

// Transfer Routes (Must be before /:id)
outletRouter.get("/transfers/incoming", protect, getIncomingTransfersController);
outletRouter.get("/transfers/outgoing", protect, getOutgoingTransfersController);
outletRouter.post("/transfers/:id/accept", protect, acceptTransferRequestController);
outletRouter.post("/transfers/:id/reject", protect, rejectTransferRequestController);
outletRouter.delete("/transfers/:id/cancel", protect, cancelTransferRequestController);

outletRouter.get("/:id", outletController.getById);
outletRouter.get("/slug/:slug", outletController.getBySlug);
outletRouter.get("/business/:businessId", outletController.getByBusinessId);

// Rute yang dilindungi dan hanya untuk Owner
outletRouter.post("/", protect, authorize(UserRole.OWNER), requireActiveSubscription, validateSchema(createOutletSchema), outletController.create);
outletRouter.patch("/:id", protect, authorize(UserRole.OWNER), requireActiveSubscription, validateSchema(updateOutletSchema), outletController.update);
outletRouter.delete("/:id", protect, authorize(UserRole.OWNER), requireActiveSubscription, outletController.delete);
outletRouter.patch("/:outletId/location", protect, authorize(UserRole.OWNER), requireActiveSubscription, validateSchema(updateOutletLocationSchema), outletController.updateLocation);
outletRouter.post("/:outletId/transfer", protect, authorize(UserRole.OWNER), createTransferRequestController);

// QRIS Management Routes
outletRouter.post(
    "/:id/qris",
    protect,
    authorize(UserRole.OWNER),
    requireActiveSubscription,
    outletController.uploadQRIS
);

outletRouter.get(
    "/:id/qris",
    outletController.getQRIS
);

outletRouter.get("/:outletId/revenue-trend", outletController.getRevenueTrend);

outletRouter.get("/:outletId/analytics", outletController.getAnalytics);

export default outletRouter;