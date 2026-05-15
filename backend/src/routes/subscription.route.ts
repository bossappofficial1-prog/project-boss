import { Router } from "express";
import { authorize, protect } from "../middleware/auth.middleware";
import {
    uploadPaymentProofController,
    getSubscriptionInvoiceController,
    getSubscriptionStatusController,
    getOwnerSubscriptionOverviewController,
    listOwnerInvoicesController,
    renewSubscriptionController,
    cancelSubscriptionInvoiceController,
} from "../controller/subscription.controller";
import multer from "multer";
import path from "path";
import fs from "fs";
import { UserRole } from "@prisma/client";
import { validateSchema } from "../middleware/zod.middleware";
import { renewSubscriptionSchema } from "../schemas/subscription.schema";

const subscriptionRouter = Router();

// Configure multer for proof image uploads
const proofUploadDir = path.join(process.cwd(), 'uploads', 'payment-proofs');
if (!fs.existsSync(proofUploadDir)) {
    fs.mkdirSync(proofUploadDir, { recursive: true });
}
const proofStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, proofUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const proofUpload = multer({
    storage: proofStorage,
    fileFilter: (req, file, cb) => {
        // Only accept image files
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file gambar yang diperbolehkan'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

/**
 * Subscription routes
 * All routes require authentication
 */

// Upload payment proof
subscriptionRouter.post(
    '/upload-proof',
    protect,
    proofUpload.single('proof'),
    uploadPaymentProofController
);

// Get invoice details
subscriptionRouter.get(
    '/invoice/:invoiceId',
    protect,
    getSubscriptionInvoiceController
);

// Get current subscription status
subscriptionRouter.get(
    '/status',
    protect,
    getSubscriptionStatusController
);

subscriptionRouter.get(
    '/me',
    protect,
    authorize(UserRole.OWNER),
    getOwnerSubscriptionOverviewController
);

subscriptionRouter.get(
    '/invoices',
    protect,
    authorize(UserRole.OWNER),
    listOwnerInvoicesController
);

subscriptionRouter.post(
    '/renew',
    protect,
    authorize(UserRole.OWNER),
    validateSchema(renewSubscriptionSchema),
    renewSubscriptionController
);

subscriptionRouter.post(
    '/invoice/:invoiceId/cancel',
    protect,
    authorize(UserRole.OWNER),
    cancelSubscriptionInvoiceController
);

export default subscriptionRouter;
