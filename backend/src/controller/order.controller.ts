import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { HttpStatus } from "../constants/http-status";
import { getOrderByIdService, refundOrderService, createOrderAndMidtransTransactionService, updateOrderStatusService, completeServiceOrderService } from "../service/order.service";
import { ReceiptService } from "../service/receipt.service";

export const updateOrderStatusController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const order = await updateOrderStatusService(id, status);
    return ResponseUtil.success(res, order);
});

export const getOrderReceiptController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const order = await getOrderByIdService(id);

    if (!order) {
        throw new Error("Order not found");
    }

    const pdfBuffer = await ReceiptService.generateReceipt(order as any);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${order.id}.pdf`);
    res.send(pdfBuffer);
});

export const createOrderController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    const { order, midtransTransaction } = await createOrderAndMidtransTransactionService(payload);
    return ResponseUtil.success(res, {
        orderId: order.id,
        totalAmount: order.totalAmount,
        midtransTransactionToken: midtransTransaction.token,
        midtransRedirectUrl: midtransTransaction.redirect_url,
    });
});

export const completeOrderController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
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
    const order = await refundOrderService(id);
    return ResponseUtil.success(res, order);
});