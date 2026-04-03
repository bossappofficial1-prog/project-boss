import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { PaymentService } from "../service/payment.service";
import { ResponseUtil } from "../utils/response";
import { messagePublisher } from "../service/message-publisher.service";
import { CreatePaymentPayload } from "../schemas/payment-v2.schema";
import { HttpStatus } from "../constants/http-status";
import { AppError } from "../errors/app-error";
import { Messages } from "../constants/message";
import { PaymentStatus } from "@prisma/client";
import { processMidtransPaymentNotification } from "../service/payment-update.service";
import { ensureString } from "../utils/request";

export class PaymentController {
  constructor(private readonly service: PaymentService) { }

  public createPayment = asyncHandler(async (req: Request, res: Response) => {
    const {
      guestCustomer,
      items,
      paymentMethod,
      onlinePaymentChannel,
      bookingSlotId,
      staffId,
      outletId,
    } = req.body as CreatePaymentPayload;

    const result = await this.service.createPayment({
      guestCustomer,
      items,
      paymentMethod,
      onlinePaymentChannel,
      outletId,
      bookingSlotId,
      staffId,
    });

    return ResponseUtil.success(res, result, HttpStatus.CREATED);
  });

  public getPaymentOrder = asyncHandler(async (req: Request, res: Response) => {
    const orderId = ensureString(req.params?.orderId, "orderId");
    const result = await this.service.getPaymentOrder(orderId);
    return ResponseUtil.success(res, result);
  });

  public createQrisPayment = asyncHandler(async (req: Request, res: Response) => {
    const orderId = ensureString(req.params?.orderId, "orderId");
    const charge = await this.service.createQrisPayment(orderId);
    return ResponseUtil.success(res, charge);
  });

  public handleNotification = asyncHandler(async (req: Request, res: Response) => {
    const notificationPayload = req.body;

    await messagePublisher.publishPaymentWebhookReceived(notificationPayload, "midtrans");

    try {
      await processMidtransPaymentNotification(notificationPayload);
    } catch (error) {
      console.error("❌ Failed to process Midtrans payment notification:", error);
    }

    return ResponseUtil.success(res, { message: "Webhook received and queued" });
  });

  public cancelPayment = asyncHandler(async (req: Request, res: Response) => {
    const orderId = ensureString(req.params?.orderId, "orderId");
    const result = await this.service.cancelPayment(orderId);
    return ResponseUtil.success(res, result, HttpStatus.OK);
  });

  public uploadManualPaymentProof = asyncHandler(
    async (req: Request, res: Response) => {
      const orderId = ensureString(req.params?.orderId, "orderId");

      if (!req.file?.path) {
        throw new AppError(Messages.REQUIRED_FIELD_MISSING, HttpStatus.BAD_REQUEST);
      }

      const result = await this.service.uploadManualPaymentProof(orderId, req.file.path);
      return ResponseUtil.success(res, result, HttpStatus.OK);
    }
  );

  public verifyManualPayment = asyncHandler(async (req: Request, res: Response) => {
    if (!req.storedUser?.id) {
      throw new AppError(Messages.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    const orderId = ensureString(req.params?.orderId, "orderId");
    const result = await this.service.verifyManualPayment(orderId, req.storedUser.id);
    return ResponseUtil.success(res, result, HttpStatus.OK);
  });

  public rejectManualPayment = asyncHandler(async (req: Request, res: Response) => {
    if (!req.storedUser?.id) {
      throw new AppError(Messages.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    const orderId = ensureString(req.params?.orderId, "orderId");
    const { reason } = req.body as { reason?: string };

    if (!reason) {
      throw new AppError("Alasan penolakan wajib diisi", HttpStatus.BAD_REQUEST);
    }

    const result = await this.service.rejectManualPayment(orderId, req.storedUser.id, reason);
    return ResponseUtil.success(res, result, HttpStatus.OK);
  });

  public listManualPayments = asyncHandler(async (req: Request, res: Response) => {
    const { status, outletId, search, page, limit } = req.query;

    let statusFilters: PaymentStatus[] | undefined;
    if (typeof status === "string") {
      const requested = status.split(",").map((s) => s.trim().toUpperCase());
      statusFilters = requested.filter((value): value is PaymentStatus =>
        Object.values(PaymentStatus).includes(value as PaymentStatus)
      ) as PaymentStatus[];
    }

    const result = await this.service.getManualPayments({
      status: statusFilters,
      outletId: typeof outletId === "string" ? outletId : undefined,
      search: typeof search === "string" ? search : undefined,
      page: typeof page === "string" ? Number(page) : undefined,
      limit: typeof limit === "string" ? Number(limit) : undefined,
    });

    return ResponseUtil.success(res, result, HttpStatus.OK);
  });
}
