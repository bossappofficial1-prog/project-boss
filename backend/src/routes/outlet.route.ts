import { Router } from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import {
    createOutletController,
    deleteOutletController,
    getAllOutletsController,
    getOutletByIdController,
    getOutletsByBusinessIdController,
    getFeaturedOutletsController,
    updateOutletController,
    findNearbyOutletsController,
    findOutletsInViewportController,
    updateOutletLocationController,
    uploadQRISController,
    getQRISController,
    getOutletAnalyticsController,
    getOutletRevenueTrendController,
    getOutletBySlugController,
    getOutletSlugsController
} from "../controller/outlet.controller";
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
outletRouter.get("/", getAllOutletsController);
outletRouter.get("/featured", getFeaturedOutletsController);
outletRouter.get("/nearby", findNearbyOutletsController);
outletRouter.get("/map", findOutletsInViewportController);
outletRouter.get("/slugs", getOutletSlugsController);

// Transfer Routes (Must be before /:id)
outletRouter.get("/transfers/incoming", protect, getIncomingTransfersController);
outletRouter.get("/transfers/outgoing", protect, getOutgoingTransfersController);
outletRouter.post("/transfers/:id/accept", protect, acceptTransferRequestController);
outletRouter.post("/transfers/:id/reject", protect, rejectTransferRequestController);
outletRouter.delete("/transfers/:id/cancel", protect, cancelTransferRequestController);

outletRouter.get("/:id", getOutletByIdController);
outletRouter.get("/slug/:slug", getOutletBySlugController);
outletRouter.get("/business/:businessId", getOutletsByBusinessIdController);

// Rute yang dilindungi dan hanya untuk Owner
outletRouter.post("/", protect, authorize(UserRole.OWNER), requireActiveSubscription, validateSchema(createOutletSchema), createOutletController);
outletRouter.patch("/:id", protect, authorize(UserRole.OWNER), requireActiveSubscription, validateSchema(updateOutletSchema), updateOutletController);
outletRouter.delete("/:id", protect, authorize(UserRole.OWNER), requireActiveSubscription, deleteOutletController);
outletRouter.patch("/:outletId/location", protect, authorize(UserRole.OWNER), requireActiveSubscription, validateSchema(updateOutletLocationSchema), updateOutletLocationController);
outletRouter.post("/:outletId/transfer", protect, authorize(UserRole.OWNER), createTransferRequestController);

// QRIS Management Routes
outletRouter.post(
    "/:id/qris",
    protect,
    authorize(UserRole.OWNER),
    requireActiveSubscription,
    uploadQRISController
);

outletRouter.get(
    "/:id/qris",
    getQRISController
);

outletRouter.get("/:outletId/revenue-trend", getOutletRevenueTrendController);

outletRouter.get("/:outletId/analytics", getOutletAnalyticsController)

export default outletRouter;