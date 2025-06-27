import { Request, Response } from "express"
import { handlerAnyError } from "../errors/api_errors"
import { getAllOutletService } from "../services/outlet.service"
import { ResponseUtil } from "../utils/response.util"

export async function getAllOutletController(req: Request, res: Response) {
    try {
        const { page, limit, search } = req.query
        const pageNumber = Number(page) > 0 ? Number(page) : 1
        const limitNumber = Number(limit) > 0 ? Number(limit) : 10
        const searchTerm = typeof search === "string" ? search : ''

        const outlets = await getAllOutletService(pageNumber, limitNumber, searchTerm)

        return ResponseUtil.success(res, outlets, "berhasil mendapatkan data.", 200)
    } catch (error) {
        return handlerAnyError(error, res)
    }
}