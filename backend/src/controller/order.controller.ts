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
import sharp from "sharp";
import { EscPosEncoder } from "../utils/escpos-encoder";
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
  await page.setContent(await generateReceiptHtml(receiptData), { waitUntil: "networkidle0" });

  const bodyHandle = await page.$('body');
  const boundingBox = await bodyHandle?.boundingBox();
  const contentHeight = Math.ceil(boundingBox?.height || 120);
  console.log(contentHeight)

  const pdfBuffer = await page.pdf({
    width: `${receiptData.printWidth}mm`,
    height: `${receiptData.printHeight == 'auto' ? contentHeight + "px" : receiptData.printHeight + "mm"}`,
    printBackground: true,
    pageRanges: "1",
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await browser.close();

  res.contentType("application/pdf");
  res.send(pdfBuffer);
});

export const getOrderReceiptPrintController = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const receiptData = await getOrderReceiptService(id as string);

  if (!receiptData) {
    throw new AppError("Pesanan tidak ditemukan atau data struk tidak lengkap", HttpStatus.NOT_FOUND);
  }

  // 1. Render HTML via Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  // Set printer width in pixels for rendering
  // 80mm printer is usually 576px wide, 58mm is 384px.
  const printWidthMm = receiptData.printWidth || 58;
  const pixelWidth = printWidthMm as number === 80 ? 576 : 384;

  await page.setViewport({ width: pixelWidth, height: 800 });
  await page.setContent(await generateReceiptHtml(receiptData), { waitUntil: "networkidle0" });

  // Get full page height
  const bodyHandle = await page.$('body');
  const boundingBox = await bodyHandle?.boundingBox();
  const contentHeight = Math.ceil(boundingBox?.height || 400);

  // Take screenshot
  const screenshot = await page.screenshot({
    fullPage: true,
    type: 'png',
    omitBackground: true
  });
  await browser.close();

  // 2. Process Image with Sharp for Thermal Printer
  // Convert to grayscale, resize back to exact pixelWidth (to be safe), and use threshold for B&W
  const { data, info } = await sharp(screenshot)
    .resize(pixelWidth)
    .grayscale()
    .threshold(180) // Brighter threshold for sharper 1-bit result
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 3. Bit packing logic for ESC/POS (GS v 0)
  // info.width is pixels, data is 1 byte per pixel grayscale (0 or 255)
  const widthBytes = pixelWidth / 8;
  const packedData = Buffer.alloc(widthBytes * info.height);

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < pixelWidth; x++) {
      const idx = y * pixelWidth + x;
      const isBlack = data[idx] < 128; // Raw byte value from sharp threshold

      if (isBlack) {
        const byteIdx = y * widthBytes + Math.floor(x / 8);
        const bitIdx = 7 - (x % 8);
        packedData[byteIdx] |= (1 << bitIdx);
      }
    }
  }

  // 4. Encode to ESC/POS
  const encoder = new EscPosEncoder();
  encoder.initialize()
    .alignLeft() // Always left align image payload to ensure correct bit positioning
    .image(packedData, pixelWidth, info.height)
    .feed(3)
    .cut();

  res.contentType("application/octet-stream");
  res.send(encoder.encode());
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
