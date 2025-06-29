import { NextFunction, Request, response, Response } from "express";
import { handlerAnyError } from "../errors/api_errors";
import { getAllOutletService, getOutletById, getOutletDashboardService } from "../services/outlet.service";
import { ResponseUtil } from "../utils/response.util";
import { createProductService, getProductByType, getProductOutletService } from "../services/product.service";
import { ProductType } from "@prisma/client";
import { isValidEnumValue } from "../utils/enum";
import { getOrderOutlet } from "../services/order.service";

export async function getAllOutletController(req: Request, res: Response) {
  try {
    const { page, limit, search } = req.query;
    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const limitNumber = Number(limit) > 0 ? Number(limit) : 12;
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

export async function getOutletProductGoods(req: Request, res: Response) {
  try {
    const { id } = req.params
    const type = req.query.type
    const t = Object.values(ProductType)

    console.log(t);

    if (!isValidEnumValue(Object.values(ProductType), type)) {
      return ResponseUtil.error(res, "Invalid product type", 400);
    }
    const products = await getProductByType(id, "GOODS")

    return ResponseUtil.success(res, products)
  } catch (error) {
    return handlerAnyError(error, res)
  }
}

export async function getOutletOderGoods(req: Request, res: Response) {
  try {
    const { id } = req.params

    const order = await getOrderOutlet(id, "GOODS")

    return ResponseUtil.success(res, order)
  } catch (error) {
    return handlerAnyError(error, res)
  }
}

export async function getOutletOderService(req: Request, res: Response) {
  try {
    const { id } = req.params

    const order = await getOrderOutlet(id, "SERVICE")

    return ResponseUtil.success(res, order)
  } catch (error) {
    return handlerAnyError(error, res)
  }
}

export async function getOutletDashboard(req: Request, res: Response) {
  try {
    const { outletId } = req.params
    const data = await getOutletDashboardService(outletId)

    return ResponseUtil.success(res, data)
  } catch (error) {
    return handlerAnyError(error, res)
  }
}

export async function createProductFoOutlet(req: Request, res: Response, next: NextFunction) {
  try {
    const { outletId } = req.params
    const image = req.file?.filename
    const {
      name,
      price,
      type,
      costPrice,
      description,
      quantity,
      unit
    } = req.body

    const priceNumber = parseInt(price, 0)
    const costPriceNumber = parseInt(costPrice, 0)
    const quantityNumber = parseInt(quantity, 0)

    const newProduct = await createProductService(outletId, {
      image,
      name,
      price: priceNumber,
      type,
      costPrice: costPriceNumber,
      description,
      quantity: quantityNumber,
      unit
    })

    return ResponseUtil.success(res, newProduct, 'success', 201)
  } catch (error) {
    return next(error)
  }
}