import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import {
    createPaymentService,
    createQrisPaymentService,
    cancelPaymentService,
    uploadManualPaymentProofService,
    verifyManualPaymentService,
    rejectManualPaymentService,
    getManualPaymentsService,
    getPaymentOrderService
} from "../service/payment.service";
import { ResponseUtil } from "../utils/response";
import { messagePublisher } from "../service/message-publisher.service";
import { CreatePaymentPayload } from "../schemas/payment-v2.schema";
import { HttpStatus } from "../constants/http-status";
import { AppError } from "../errors/app-error";
import { Messages } from "../constants/message";
import { PaymentStatus } from "@prisma/client";
import { processMidtransPaymentNotification } from "../service/payment-update.service";
import { ensureString } from "../utils/request";

export const createPaymentController = asyncHandler(async (req: Request, res: Response) => {
    const { customer_details, item_details, payment_method, selectedSlotId, staffId, outletId } = req.body as CreatePaymentPayload

    const result = await createPaymentService({ customer_details, item_details, payment_method, outletId, selectedSlotId, staffId })

    return ResponseUtil.success(res, result, HttpStatus.CREATED)
})

export const getPaymentOrderController = asyncHandler(async (req: Request, res: Response) => {
    const orderId = ensureString(req.params?.orderId, 'orderId')
    const result = await getPaymentOrderService(orderId)
    return ResponseUtil.success(res, result)
})

export const createQrisPaymentController = asyncHandler(async (req: Request, res: Response) => {
    const orderId = ensureString(req.params?.orderId, 'orderId');
    const charge = await createQrisPaymentService(orderId);
    return ResponseUtil.success(res, charge);
});

export const handleNotificationController = asyncHandler(async (req: Request, res: Response) => {
    const notificationPayload = req.body;

    // Terbitkan seluruh payload notifikasi ke RabbitMQ
    await messagePublisher.publishPaymentWebhookReceived(notificationPayload, 'midtrans');

    try {
        await processMidtransPaymentNotification(notificationPayload);
    } catch (error) {
        console.error('❌ Failed to process Midtrans payment notification:', error);
    }

    // Langsung balas 200 OK
    return ResponseUtil.success(res, { message: "Webhook received and queued" });
});

export const cancelPaymentController = asyncHandler(async (req: Request, res: Response) => {
    const orderId = ensureString(req.params?.orderId, 'orderId');
    const result = await cancelPaymentService(orderId);
    return ResponseUtil.success(res, result, HttpStatus.OK);
});

export const uploadManualPaymentProofController = asyncHandler(async (req: Request, res: Response) => {
    const orderId = ensureString(req.params?.orderId, 'orderId');

    if (!req.file?.path) {
        throw new AppError(Messages.REQUIRED_FIELD_MISSING, HttpStatus.BAD_REQUEST);
    }

    const result = await uploadManualPaymentProofService(orderId, req.file.path);
    return ResponseUtil.success(res, result, HttpStatus.OK);
});

export const verifyManualPaymentController = asyncHandler(async (req: Request, res: Response) => {
    if (!req.storedUser?.id) {
        throw new AppError(Messages.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    const orderId = ensureString(req.params?.orderId, 'orderId');
    const result = await verifyManualPaymentService(orderId, req.storedUser.id);
    return ResponseUtil.success(res, result, HttpStatus.OK);
});

export const rejectManualPaymentController = asyncHandler(async (req: Request, res: Response) => {
    if (!req.storedUser?.id) {
        throw new AppError(Messages.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    const orderId = ensureString(req.params?.orderId, 'orderId');
    const { reason } = req.body as { reason?: string };

    if (!reason) {
        throw new AppError('Alasan penolakan wajib diisi', HttpStatus.BAD_REQUEST);
    }

    const result = await rejectManualPaymentService(orderId, req.storedUser.id, reason);
    return ResponseUtil.success(res, result, HttpStatus.OK);
});

export const listManualPaymentsController = asyncHandler(async (req: Request, res: Response) => {
    const { status, outletId, search, page, limit } = req.query;

    let statusFilters: PaymentStatus[] | undefined;
    if (typeof status === 'string') {
        const requested = status.split(',').map(s => s.trim().toUpperCase());
        statusFilters = requested.filter((value): value is PaymentStatus =>
            Object.values(PaymentStatus).includes(value as PaymentStatus)
        ) as PaymentStatus[];
    }

    const result = await getManualPaymentsService({
        status: statusFilters,
        outletId: typeof outletId === 'string' ? outletId : undefined,
        search: typeof search === 'string' ? search : undefined,
        page: typeof page === 'string' ? Number(page) : undefined,
        limit: typeof limit === 'string' ? Number(limit) : undefined
    });

    return ResponseUtil.success(res, result, HttpStatus.OK);
});

// export const getOrderPaymentController = asyncHandler(async (req: Request, res: Response) => {
//     const { orderId } = req.params;
//     const orderData = await getorder(orderId);

//     return ResponseUtil.success(res, orderData);
// })