import { NextFunction, Request, Response } from "express";
import { updateProductService } from "../services/product.service";
import { ResponseUtil } from "../utils/response.util";
import { config } from "../configs/config";

export async function updateProductController(req: Request, res: Response, next: NextFunction) {
    try {
        const { outletId, productId } = req.params
        const { costPrice,
            description,
            name,
            price,
            quantity,
            type,
            unit, } = req.body

        let image = undefined
        const priceNumber = price ? parseInt(price, 0) : undefined
        const costPriceNumber = costPrice ? parseInt(costPrice, 0) : undefined
        const quantityNumber = quantity ? parseInt(quantity, 0) : undefined
        
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
}