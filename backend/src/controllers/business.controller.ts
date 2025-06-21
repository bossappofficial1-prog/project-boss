import { Request, Response } from "express";
import { handlerAnyError } from "../errors/api_errors";
import { getAllBusiness, getBusinessDetailService, getBusinessProductService, getBusinessService } from "../services/business.service";
import { ResponseUtil } from "../utils/response.util";

export async function getAllBusinessesController(req: Request, res: Response) {
    try {
        const businesses = await getAllBusiness()
        return ResponseUtil.success(res, businesses, "berhasil mengambil data")
    } catch (error) {
        return handlerAnyError(error, res)
    }
}

export async function getBusinessProductController(req: Request, res: Response) {
    try {
        const { id } = req.params
        const business = await getBusinessService(id)
        const products = await getBusinessProductService(id)

        return ResponseUtil.success(res, { business, products })
    } catch (error) {
        return handlerAnyError(error, res)
    }
}

export async function getBusinessDetailController(req: Request, res: Response) {
    try {
        const { id } = req.params
        const business = await getBusinessDetailService(id)

        return ResponseUtil.success(res, { business })
    } catch (error) {
        return handlerAnyError(error, res)
    }
}