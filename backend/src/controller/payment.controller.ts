import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { createMidtransTransactionService, createQrisPaymentService, handleMidtransNotificationService } from "../service/payment.service";
import { ResponseUtil } from "../utils/response";

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
    const notification = req.body;
    await handleMidtransNotificationService(notification);
    return ResponseUtil.success(res, { message: "Notification handled" });
});