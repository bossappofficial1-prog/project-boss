import { Request, Response } from "express";
import { handlerAnyError } from "../errors/api_errors";
import { getAllBusiness, getBusinessDetailService, getBusinessProductService, getBusinessService } from "../services/business.service";
import { ResponseUtil } from "../utils/response.util";
import { getBusinessWalletService } from "../services/wallet.service";

export async function getAllBusinessesController(req: Request, res: Response) {
    try {
        const { page, limit, search } = req.query
        const pageNumber = Number(page) > 0 ? Number(page) : 1
        const limitNumber = Number(limit) > 0 ? Number(limit) : 10
        const searchTerm = typeof search === "string" ? search : ''

        const businesses = await getAllBusiness(pageNumber, limitNumber, searchTerm)
        return ResponseUtil.paginated(res, businesses, pageNumber, limitNumber, (pageNumber * limitNumber), "berhasil mengambil data")
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

        return ResponseUtil.success(res, business)
    } catch (error) {
        return handlerAnyError(error, res)
    }
}

export async function getBusinessWalletController(req: Request, res: Response) {
    try {
        const user = req.user
        const wallet = await getBusinessWalletService(user?.id!)

        return ResponseUtil.success(res, wallet)
    } catch (error) {
        return handlerAnyError(error, res)
    }
}