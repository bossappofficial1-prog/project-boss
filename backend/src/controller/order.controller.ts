import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { HttpStatus } from "../constants/http-status";
import {
    getOrderByIdService, refundOrderService,
    createOrderAndMidtransTransactionService,
    updateOrderStatusService, completeServiceOrderService,
    getGoodsOrdersByOutletService, getServiceQueueByOutletService
} from "../service/order.service";
import { ReceiptService } from "../service/receipt.service";

export const getOrderReceiptController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const ownerId = req.user!.id;
    const order = await getOrderByIdService(id, ownerId);

    if (!order) {
        throw new Error("Order not found");
    }

    const pdfBuffer = await ReceiptService.generateReceipt(order as any);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${order.id}.pdf`);
    res.send(pdfBuffer);
});

export const updateOrderStatusController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const ownerId = req.user!.id;

    // Validate ownership before update
    await getOrderByIdService(id, ownerId);

    const order = await updateOrderStatusService(id, status);
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
        midtransTransactionToken: midtransTransaction.token,
        midtransRedirectUrl: midtransTransaction.redirect_url,
    });
});

export const completeOrderController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const ownerId = req.user!.id;

    // Validate ownership before complete
    await getOrderByIdService(id, ownerId);

    const order = await completeServiceOrderService(id);
    ResponseUtil.success(res, order);
});

export const getOrderByIdController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const order = await getOrderByIdService(id);
    return ResponseUtil.success(res, order);
});

export const refundOrderController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const ownerId = req.user!.id;

    // Validate ownership before refund
    await getOrderByIdService(id, ownerId);

    const order = await refundOrderService(id);
    return ResponseUtil.success(res, order);
});

export const listGoodsOrdersByOutletController = asyncHandler(async (req: Request, res: Response) => {
    const { outletId } = req.params;
    const { status, page, limit } = req.query as any;
    const ownerId = req.user!.id;

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
    const { outletId } = req.params;
    const { page, limit } = req.query as any;
    const ownerId = req.user!.id;

    const result = await getServiceQueueByOutletService(
        outletId,
        ownerId,
        {
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined
        }
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