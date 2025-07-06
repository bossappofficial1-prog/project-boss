import { NextFunction, Request, Response } from "express";
import { updateProductService } from "../services/product.service";
import { ResponseUtil } from "../utils/response.util";
import { config } from "../configs/config";
import { asyncHandler } from "../middlewares/error.middleware";
import { Midtrans } from "../configs/midtrans";
import { createOrderService } from "../services/order.service";

export const updateProductController = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { outletId, productId } = req.params
        const { costPrice,
            description,
            name,
            price,
            quantity,
            type,
            unit
        } = req.body

        let image = undefined

        if (req.file) {
            image = `${config.BASE_URL}/products/${req.file.filename}`
        }

        const updatedProduct = await updateProductService(outletId, productId, {
            costPrice,
            description,
            name,
            price,
            quantity,
            type,
            unit,
            image
        })

        return ResponseUtil.success(res, updatedProduct)
    } catch (error) {
        return next(error)
    }
})

export const createProductOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const params = req.body

        const midtrans = new Midtrans()
        const transaction = await createOrderService(params)

        return ResponseUtil.success(res, transaction)
    } catch (error) {
        return next(error)
    }


})