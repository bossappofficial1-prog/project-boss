import puppeteer from "puppeteer";
import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { HttpStatus } from "../constants/http-status";
import {
    getOrderByIdService, refundOrderService,
    createOrderAndMidtransTransactionService,
    updateOrderStatusService, updateServiceQueueStatusService, completeServiceOrderService,
    getGoodsOrdersByOutletService, getServiceQueueByOutletService,
    getOrderByCustomerPhoneService,
    cancelOrderByCustomerService,
    confirmOrderByCustomerService,
    getOrderReceiptService
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
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(generateReceiptHtml(receiptData), { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
        width: `${receiptData.printWidth}mm`,
        height: `${receiptData.printHeight}mm`,
        printBackground: true,
        pageRanges: '1',
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();

    res.contentType("application/pdf");
    res.send(pdfBuffer);
});

export const updateOrderStatusController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body;
    const ownerId = req.storedUser!.id;

    // Validate ownership before update
    await getOrderByIdService(id, ownerId);

    const order = await updateOrderStatusService(id, status);
    return ResponseUtil.success(res, order);
});

export const updateServiceOrderStatusController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body;
    const user = req.storedUser!;

    // Jika kasir, gunakan outletId dari session kasir untuk validasi
    const isCashier = (user as any).userType === 'CASHIER';
    const userIdentifier = isCashier ? (user as any).outletId : user.id;
    const validateAsOwner = !isCashier;

    const order = await updateServiceQueueStatusService(id, userIdentifier, status, validateAsOwner);
    return ResponseUtil.success(res, order);
});

export const createOrderController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;

    // SECURITY: Log guest order creation for monitoring
    console.log(`[GUEST ORDER] Creating order for phone: ${payload.guestCustomer?.phone?.slice(-4)} at outlet: ${payload.outletId}`);

    const { order, midtransTransaction } = await createOrderAndMidtransTransactionService(payload);

    // SECURITY: Log successful order creation
    console.log(`[GUEST ORDER SUCCESS] Order ${order.id} created successfully for amount: ${order.totalAmount}`);

    return ResponseUtil.success(res, {
        orderId: order.id,
        totalAmount: order.totalAmount,
        ...(midtransTransaction ? {
            midtransTransactionToken: (midtransTransaction as any).token,
            midtransRedirectUrl: (midtransTransaction as any).redirect_url,
        } : {}),
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

export const listGoodsOrdersByOutletController = asyncHandler(async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string;
    const { status, page, limit } = req.query as any;
    const ownerId = req.storedUser!.id;

    const result = await getGoodsOrdersByOutletService(
        outletId,
        ownerId,
        {
            status,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined
        } as any
    );
    return ResponseUtil.paginated(
        res,
        result.data,
        result.page,
        result.limit,
        result.total,
        HttpStatus.OK);
});

export const listServiceQueueByOutletController = asyncHandler(async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string;
    const { page, limit } = req.query as any;
    const user = req.storedUser!;

    // Jika kasir, gunakan outletId dari session kasir untuk validasi
    const isCashier = (user as any).userType === 'CASHIER';
    const userIdentifier = isCashier ? (user as any).outletId : user.id;
    const validateAsOwner = !isCashier;

    const result = await getServiceQueueByOutletService(
        outletId,
        userIdentifier,
        {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined
        },
        validateAsOwner
    );
    return ResponseUtil.paginated(
        res,
        result.data,
        result.page,
        result.limit,
        result.total,
        HttpStatus.OK
    );
});

export const getOrderByCustomerPhoneController = asyncHandler(async (req: Request, res: Response) => {
    const phone = req.params.phone as string

    const customerOrder = await getOrderByCustomerPhoneService(phone)
    return ResponseUtil.success(res, customerOrder)
})

export const getOrderNotificationDataController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const order = await getOrderByIdService(id);

    if (!order) {
        return ResponseUtil.notFound(res, 'Order not found');
    }

    // Format data untuk notifikasi WhatsApp
    // const notificationData = {
    //     id: order.id,
    //     totalAmount: order.totalAmount,
    //     paymentMethod: 'Online', // Default for now
    //     updatedAt: order.updatedAt.toISOString(),
    //     guestCustomer: {
    //         name: order.guestCustomer.name,
    //         phone: order.guestCustomer.phone
    //     },
    //     outlet: {
    //         name: order.outlet.name,
    //         address: order.outlet.address,
    //         phone: order.outlet.phone,
    //         whatsapp: order.outlet.phone
    //     },
    //     items: order.items.map(item => ({
    //         quantity: item.quantity,
    //         product: {
    //             name: item.product.name,
    //             type: item.product.type
    //         }
    //     })),
    //     bookingSlot: order.bookingSlot ? {
    //         dateTime: order.bookingSlot.startTime.toISOString()
    //     } : undefined
    // };

    return ResponseUtil.success(res, {});
})

export const cancelOrderByCustomerController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { phone, reason } = req.body as { phone: string; reason?: string };

    const order = await cancelOrderByCustomerService(id, phone, reason);

    return ResponseUtil.success(res, order);
});

export const confirmOrderByCustomerController = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { phone } = req.body as { phone: string };

    const order = await confirmOrderByCustomerService(id, phone);

    return ResponseUtil.success(res, order);
});