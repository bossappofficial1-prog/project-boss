import puppeteer from "puppeteer-core";
import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { HttpStatus } from "../constants/http-status";
import { AppError } from "../errors/app-error";
import {
  getOrderByIdService,
  refundOrderService,
  createOrderAndMidtransTransactionService,
  updateOrderStatusService,
  updateServiceQueueStatusService,
  completeServiceOrderService,
  getGoodsOrdersByOutletService,
  getServiceQueueByOutletService,
  getOrderByCustomerPhoneService,
  confirmOrderByCustomerService,
  getOrderReceiptService,
  getOrdersListService,
  cancelOrderByCustomerService,
} from "../service/order.service";
import { generateReceiptHtml } from "../service/helpers/receipt-template";

export const getOrderReceiptController = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const receiptData = await getOrderReceiptService(id as string);

  if (!receiptData) {
    throw new Error("Order not found");
  }
  const browser = await puppeteer.launch({
    headless: true,
    executablePath:
      process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  const page = await browser.newPage();
  await page.setContent(generateReceiptHtml(receiptData), { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    width: `${receiptData.printWidth}mm`,
    height: `${receiptData.printHeight}mm`,
    printBackground: true,
    pageRanges: "1",
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await browser.close();

  res.contentType("application/pdf");
  res.send(pdfBuffer);
});

export const updateOrderStatusController = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status, reason } = req.body;
  const user = req.storedUser!;

  console.log(
    `[UPDATE STATUS] Order: ${id}, Status: ${status}, User: ${user.id}, Role: ${user.role}, Type: ${(user as any).userType}`,
  );

  const isCashier = (user as any).userType === "CASHIER";
  const ownerId = isCashier ? undefined : user.id;

  // Validate ownership/access before update
  const order = await getOrderByIdService(id, ownerId);

  // Additional check for cashier: must belong to the same outlet
  if (isCashier) {
    const cashierOutletId = (user as any).outletId;
    if (order.outletId !== cashierOutletId) {
      throw new AppError(
        "Anda tidak berhak mengakses pesanan dari outlet lain.",
        HttpStatus.FORBIDDEN,
      );
    }
  }

  console.log(`[CONTROLLER] updateOrderStatus - ID: ${id}, Status: ${status}, Reason: ${reason}`);

  const updatedOrder = await updateOrderStatusService(id, status, reason);
  return ResponseUtil.success(res, updatedOrder);
});

export const updateServiceOrderStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status, reason } = req.body;
    const user = req.storedUser!;

    // Jika kasir, gunakan outletId dari session kasir untuk validasi
    const isCashier = (user as any).userType === "CASHIER";
    const userIdentifier = isCashier ? (user as any).outletId : user.id;
    const validateAsOwner = !isCashier;

    const order = await updateServiceQueueStatusService(
      id,
      userIdentifier,
      status,
      validateAsOwner,
      reason,
    );
    return ResponseUtil.success(res, order);
  },
);

export const createOrderController = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body;

  // SECURITY: Log guest order creation for monitoring
  console.log(
    `[GUEST ORDER] Creating order for phone: ${payload.guestCustomer?.phone?.slice(-4)} at outlet: ${payload.outletId}`,
  );

  const { order, midtransTransaction } = await createOrderAndMidtransTransactionService(payload);

  // SECURITY: Log successful order creation
  console.log(
    `[GUEST ORDER SUCCESS] Order ${order.id} created successfully for amount: ${order.totalAmount}`,
  );

  return ResponseUtil.success(res, {
    orderId: order.id,
    totalAmount: order.totalAmount,
    paymentExpiresAt: order.paymentStatus === "PENDING" ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : null,
    ...(midtransTransaction
      ? {
        midtransTransactionToken: (midtransTransaction as any).token,
        midtransRedirectUrl: (midtransTransaction as any).redirect_url,
      }
      : {}),
  });
});

export const completeOrderController = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const ownerId = req.storedUser!.id;

  // Validate ownership before complete
  await getOrderByIdService(id, ownerId);

  const order = await completeServiceOrderService(id);
  ResponseUtil.success(res, order);
});

export const getOrderByIdController = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const order = await getOrderByIdService(id);
  return ResponseUtil.success(res, order);
});

export const refundOrderController = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const ownerId = req.storedUser!.id;

  // Validate ownership before refund
  await getOrderByIdService(id, ownerId);

  const order = await refundOrderService(id);
  return ResponseUtil.success(res, order);
});

export const listGoodsOrdersByOutletController = asyncHandler(
  async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string;
    const { status, page, limit } = req.query as any;
    const user = req.storedUser!;

    // Jika kasir, gunakan outletId dari session kasir untuk validasi
    const isCashier = (user as any).userType === "CASHIER";
    const userIdentifier = isCashier ? (user as any).outletId : user.id;
    const validateAsOwner = !isCashier;

    const result = await getGoodsOrdersByOutletService(
      outletId,
      userIdentifier,
      {
        status,
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      },
      validateAsOwner,
    );
    return ResponseUtil.paginated(
      res,
      result.data,
      result.page,
      result.limit,
      result.total,
      HttpStatus.OK,
    );
  },
);

export const listServiceQueueByOutletController = asyncHandler(
  async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string;
    const { page, limit } = req.query as any;
    const user = req.storedUser!;

    // Jika kasir, gunakan outletId dari session kasir untuk validasi
    const isCashier = (user as any).userType === "CASHIER";
    const userIdentifier = isCashier ? (user as any).outletId : user.id;
    const validateAsOwner = !isCashier;

    const result = await getServiceQueueByOutletService(
      outletId,
      userIdentifier,
      {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      },
      validateAsOwner,
    );
    return ResponseUtil.paginated(
      res,
      result.data,
      result.page,
      result.limit,
      result.total,
      HttpStatus.OK,
    );
  },
);

export const getOrderByCustomerPhoneController = asyncHandler(
  async (req: Request, res: Response) => {
    const phone = req.params.phone as string;

    const customerOrder = await getOrderByCustomerPhoneService(phone);
    return ResponseUtil.success(res, customerOrder);
  },
);

export const getOrderNotificationDataController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const order = await getOrderByIdService(id);

    if (!order) {
      return ResponseUtil.notFound(res, "Order not found");
    }

    return ResponseUtil.success(res, {});
  },
);

export const cancelOrderByCustomerController = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { phone, reason } = req.body as { phone: string; reason?: string };

  const order = await cancelOrderByCustomerService(id, phone, reason);

  return ResponseUtil.success(res, order);
});

export const confirmOrderByCustomerController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { phone } = req.body as { phone: string };

    const order = await confirmOrderByCustomerService(id, phone);

    return ResponseUtil.success(res, order);
  },
);

export const getOrdersListController = asyncHandler(async (req: Request, res: Response) => {
  const { outletId, status, paymentStatus, search, page, limit } = req.query as any;

  const result = await getOrdersListService(outletId, {
    status,
    paymentStatus,
    search,
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
  });

  return ResponseUtil.paginated(
    res,
    result.data,
    result.page,
    result.limit,
    result.total,
    HttpStatus.OK
  );
});
