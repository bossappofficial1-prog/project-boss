import { Router } from "express";
import { PaymentService } from "../service/payment.service";
import { PaymentController } from "../controller/payment.controller";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole, StaffRole } from "@prisma/client";
import { uploadPaymentProof, handleUploadError } from "../middleware/upload.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import { CreatePaymentSchema } from "../schemas/payment-v2.schema";

const paymentRouter = Router();

const paymentService = new PaymentService();
const paymentController = new PaymentController(paymentService);

// Rute untuk membuat pembayaran QRIS (hanya Owner)
paymentRouter.post("/:orderId/qris", protect, authorize(UserRole.OWNER), paymentController.createQrisPayment);

// Rute untuk cancel pembayaran
paymentRouter.post("/:orderId/cancel", paymentController.cancelPayment);

// Manual payment routes
paymentRouter.post(
	"/:orderId/manual/proof",
	uploadPaymentProof("proof"),
	handleUploadError,
	paymentController.uploadManualPaymentProof
);

paymentRouter.post(
	"/:orderId/manual/verify",
	protect,
	authorize(UserRole.OWNER, UserRole.ADMIN, StaffRole.CASHIER),
	paymentController.verifyManualPayment
);

paymentRouter.post(
	"/:orderId/manual/reject",
	protect,
	authorize(UserRole.OWNER, UserRole.ADMIN, StaffRole.CASHIER),
	paymentController.rejectManualPayment
);

paymentRouter.get(
	"/manual",
	protect,
	authorize(UserRole.OWNER, UserRole.ADMIN, StaffRole.CASHIER),
	paymentController.listManualPayments
);

// Rute untuk webhook notifikasi dari Midtrans
paymentRouter.post("/notification/webhooks/midtrans", paymentController.handleNotification);

paymentRouter.get("/:orderId", paymentController.getPaymentOrder);

export default paymentRouter;