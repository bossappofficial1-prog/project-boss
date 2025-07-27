import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { createMidtransTransactionService, createQrisPaymentService } from "../service/payment.service";
import { ResponseUtil } from "../utils/response";
import { messagePublisher } from "../service/message-publisher.service";

// export const createTransactionController = asyncHandler(async (req: Request, res: Response) => {
//     const { orderId } = req.params;
//     const transaction = await createMidtransTransactionService(orderId);
//     return ResponseUtil.success(res, transaction);
// });

export const createQrisPaymentController = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const charge = await createQrisPaymentService(orderId);
    return ResponseUtil.success(res, charge);
});

export const handleNotificationController = asyncHandler(async (req: Request, res: Response) => {
    const notificationPayload = req.body;

    // Terbitkan seluruh payload notifikasi ke RabbitMQ
    await messagePublisher.publishPaymentWebhookReceived(notificationPayload, 'midtrans');

    // Langsung balas 200 OK
    return ResponseUtil.success(res, { message: "Webhook received and queued" });
});