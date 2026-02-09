import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { OrdersV2Service } from "../service/orders-v2.service";

export const ordersV2GetBoard = asyncHandler(async (req: Request, res: Response) => {
    const outletId = req.params.outletId as string;
    const user = req.storedUser!;

    const isCashier = (user as any).userType === "CASHIER";
    const userIdentifier = isCashier ? (user as any).outletId : user.id;
    const validateAsOwner = !isCashier;

    const result = await OrdersV2Service.getBoard(outletId, userIdentifier, validateAsOwner);
    return ResponseUtil.success(res, result);
});
