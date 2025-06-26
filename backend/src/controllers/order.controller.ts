import { Response, Request } from "express";
import { handlerAnyError } from "../errors/api_errors";
import { createOrderService } from "../services/order.service";
import { ResponseUtil } from "../utils/response.util";

export async function createORderController(req: Request, res: Response) {
    try {
        const user = req.user
        const { outletId } = req.params
        const { bookingDate, items } = req.body

        const createOrder = await createOrderService({ outletId, customerId: user?.id!, items, bookingDate })

        return ResponseUtil.success(res, createOrder, "Berhasil membuat order")
    } catch (error) {
        return handlerAnyError(error, res)
    }
}