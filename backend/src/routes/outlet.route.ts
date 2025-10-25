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
    updateOutletLocationController,
    uploadQRISController,
    getQRISController,
    deleteQRISController
} from "../controller/outlet.controller";
import { validateSchema } from "../middleware/zod.middleware";
import { createOutletSchema, updateOutletSchema, updateOutletLocationSchema } from "../schemas/outlet.schema";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";

const outletRouter = Router();

// Konfigurasi multer untuk upload QRIS
const qrisStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(process.cwd(), 'uploads', 'qris'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `qris-${randomUUID()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const qrisUpload = multer({
    storage: qrisStorage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Format file tidak valid. Hanya menerima JPG, PNG, atau WebP'));
        }
    },
});

// Rute Publik
outletRouter.get("/", getAllOutletsController);
outletRouter.get("/featured", getFeaturedOutletsController);
outletRouter.get("/nearby", findNearbyOutletsController);
outletRouter.get("/:id", getOutletByIdController);
outletRouter.get("/business/:businessId", getOutletsByBusinessIdController);

// Rute yang dilindungi dan hanya untuk Owner
outletRouter.post("/", protect, authorize(UserRole.OWNER), validateSchema(createOutletSchema), createOutletController);
outletRouter.patch("/:id", protect, authorize(UserRole.OWNER), validateSchema(updateOutletSchema), updateOutletController);
outletRouter.delete("/:id", protect, authorize(UserRole.OWNER), deleteOutletController);
outletRouter.patch("/:outletId/location", protect, authorize(UserRole.OWNER), validateSchema(updateOutletLocationSchema), updateOutletLocationController);

// QRIS Management Routes
outletRouter.post(
    "/:id/qris",
    protect,
    authorize(UserRole.OWNER),
    qrisUpload.single('qris'),
    uploadQRISController
);

outletRouter.get(
    "/:id/qris",
    getQRISController
);

outletRouter.delete(
    "/:id/qris",
    protect,
    authorize(UserRole.OWNER),
    deleteQRISController
);

export default outletRouter;