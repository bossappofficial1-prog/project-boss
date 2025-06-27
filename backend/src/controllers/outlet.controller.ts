import { Request, Response } from "express";
import { handlerAnyError } from "../errors/api_errors";
import { getAllOutletService, getOutletById } from "../services/outlet.service";
import { ResponseUtil } from "../utils/response.util";
import { getProductOutletService } from "../services/product.service";

export async function getAllOutletController(req: Request, res: Response) {
  try {
    const { page, limit, search } = req.query;
    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const limitNumber = Number(limit) > 0 ? Number(limit) : 10;
    const searchTerm = typeof search === "string" ? search : "";

    const data = await getAllOutletService(
      pageNumber,
      limitNumber,
      searchTerm
    );

    return ResponseUtil.paginated(
      res,
      data.outlets,
      pageNumber,
      limitNumber,
      data.count,
      "berhasil mendapatkan data."
    );
  } catch (error) {
    return handlerAnyError(error, res);
  }
}

export async function getOutletByIdController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const outlet = await getOutletById(id);

    return ResponseUtil.success(res, outlet, "Berhasil mendapatkan data", 200);
  } catch (error) {
    return handlerAnyError(error, res);
  }
}

export async function getOutletProductController(req: Request, res: Response) {
  try {
    const { id } = req.params
    const { page, limit, search } = req.query
    const pageNumber = Number(page) > 0 ? Number(page) : 1
    const limitNumber = Number(limit) > 0 ? Number(limit) : 10
    const searchTerm = typeof search === "string" ? search : ''

    const data = await getProductOutletService(id, {
      limit: limitNumber,
      page: pageNumber,
      search: searchTerm
    })

    return ResponseUtil.paginated(res, data.products, pageNumber, limitNumber, data.count)
  } catch (error) {
    return handlerAnyError(error, res)
  }
}