import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { createMidtransTransactionService, createPaymentService, createQrisPaymentService, cancelPaymentService } from "../service/payment.service";
import { ResponseUtil } from "../utils/response";
import { messagePublisher } from "../service/message-publisher.service";
import { generateOrderCode } from "../utils";
import { PaymentMethodId } from "../constants/payment-method";
import { CreatePaymentPayload } from "../schemas/payment-v2.schema";
import { HttpStatus } from "../constants/http-status";

export const createPaymentController = asyncHandler(async (req: Request, res: Response) => {
    const { customer_details, item_details, payment_method, selectedSlotId, outletId } = req.body as CreatePaymentPayload

    const result = await createPaymentService({ customer_details, item_details, payment_method, outletId, selectedSlotId })

    return ResponseUtil.success(res, result, HttpStatus.CREATED)
})

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

export const cancelPaymentController = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const result = await cancelPaymentService(orderId);
    return ResponseUtil.success(res, result, HttpStatus.OK);
});