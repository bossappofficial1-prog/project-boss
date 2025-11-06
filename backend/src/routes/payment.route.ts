import { Router } from "express";
import {
	createQrisPaymentController,
	handleNotificationController,
	cancelPaymentController,
	uploadManualPaymentProofController,
	verifyManualPaymentController,
	rejectManualPaymentController,
	listManualPaymentsController,
	getPaymentOrderController
} from "../controller/payment.controller";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";
import { uploadPaymentProof, handleUploadError } from "../middleware/upload.middleware";

const paymentRouter = Router();

// Rute untuk membuat transaksi (bisa dipanggil oleh customer setelah membuat order)
// paymentRouter.post("/:orderId/create", createTransactionController);

// Rute untuk membuat pembayaran QRIS (hanya Owner)
paymentRouter.post("/:orderId/qris", protect, authorize(UserRole.OWNER), createQrisPaymentController);

// Rute untuk cancel pembayaran
paymentRouter.post("/:orderId/cancel", cancelPaymentController);

// Manual payment routes
paymentRouter.post(
	"/:orderId/manual/proof",
	uploadPaymentProof('proof'),
	handleUploadError,
	uploadManualPaymentProofController
);

paymentRouter.post(
	"/:orderId/manual/verify",
	protect,
	authorize(UserRole.OWNER, UserRole.ADMIN),
	verifyManualPaymentController
);

paymentRouter.post(
	"/:orderId/manual/reject",
	protect,
	authorize(UserRole.OWNER, UserRole.ADMIN),
	rejectManualPaymentController
);

paymentRouter.get(
	"/manual",
	protect,
	authorize(UserRole.OWNER, UserRole.ADMIN),
	listManualPaymentsController
);

// Rute untuk webhook notifikasi dari Midtrans
paymentRouter.post("/notification/webhooks/midtrans", handleNotificationController);

paymentRouter.get('/:orderId', getPaymentOrderController)

export default paymentRouter;