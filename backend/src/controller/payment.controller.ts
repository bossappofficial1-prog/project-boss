import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import {
    createPaymentService,
    createQrisPaymentService,
    cancelPaymentService,
    uploadManualPaymentProofService,
    verifyManualPaymentService,
    rejectManualPaymentService,
    getManualPaymentsService
} from "../service/payment.service";
import { ResponseUtil } from "../utils/response";
import { messagePublisher } from "../service/message-publisher.service";
import { CreatePaymentPayload } from "../schemas/payment-v2.schema";
import { HttpStatus } from "../constants/http-status";
import { AppError } from "../errors/app-error";
import { Messages } from "../constants/message";
import { PaymentStatus } from "@prisma/client";

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

export const uploadManualPaymentProofController = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;

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

    const { orderId } = req.params;
    const result = await verifyManualPaymentService(orderId, req.storedUser.id);
    return ResponseUtil.success(res, result, HttpStatus.OK);
});

export const rejectManualPaymentController = asyncHandler(async (req: Request, res: Response) => {
    if (!req.storedUser?.id) {
        throw new AppError(Messages.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    const { orderId } = req.params;
    const { reason } = req.body as { reason?: string };

    if (!reason) {
        throw new AppError('Alasan penolakan wajib diisi', HttpStatus.BAD_REQUEST);
    }

    const result = await rejectManualPaymentService(orderId, req.storedUser.id, reason);
    return ResponseUtil.success(res, result, HttpStatus.OK);
});

export const listManualPaymentsController = asyncHandler(async (req: Request, res: Response) => {
    const { status, outletId, search, page, limit } = req.query as {
        status?: string;
        outletId?: string;
        search?: string;
        page?: string;
        limit?: string;
    };

    let statusFilters: PaymentStatus[] | undefined;
    if (status) {
        const requested = status.split(',').map(s => s.trim().toUpperCase());
        statusFilters = requested.filter((value): value is PaymentStatus =>
            Object.values(PaymentStatus).includes(value as PaymentStatus)
        ) as PaymentStatus[];
    }

    const result = await getManualPaymentsService({
        status: statusFilters,
        outletId,
        search,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined
    });

    return ResponseUtil.success(res, result, HttpStatus.OK);
});