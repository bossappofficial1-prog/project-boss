import { Response, Request } from "express";
import { createOrderService } from "../services/order.service";
import { ResponseUtil } from "../utils/response.util";
import { asyncHandler } from "../middlewares/error.middleware";

// MEMBUAT ORDER
export const createORderController = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user
    const { outletId } = req.params
    const { bookingDate, items } = req.body

    const createOrder = await createOrderService({ outletId, customerId: user?.id!, items, bookingDate })

    return ResponseUtil.success(res, createOrder, "Berhasil membuat order")
})