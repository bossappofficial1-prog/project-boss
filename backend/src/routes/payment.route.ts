import { Router } from "express";
import { createQrisPaymentController, handleNotificationController, cancelPaymentController } from "../controller/payment.controller";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";

const paymentRouter = Router();

// Rute untuk membuat transaksi (bisa dipanggil oleh customer setelah membuat order)
// paymentRouter.post("/:orderId/create", createTransactionController);

// Rute untuk membuat pembayaran QRIS (hanya Owner)
paymentRouter.post("/:orderId/qris", protect, authorize(UserRole.OWNER), createQrisPaymentController);

// Rute untuk cancel pembayaran
paymentRouter.post("/:orderId/cancel", cancelPaymentController);

// Rute untuk webhook notifikasi dari Midtrans
paymentRouter.post("/notification/webhooks/midtrans", handleNotificationController);

export default paymentRouter;