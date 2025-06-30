import { NextFunction, Request, response, Response } from "express";
import { getAllOutletService, getOutletById, getOutletDashboardService } from "../services/outlet.service";
import { ResponseUtil } from "../utils/response.util";
import { createProductService, getProductByType, getProductOutletService } from "../services/product.service";
import { ProductType } from "@prisma/client";
import { isValidEnumValue } from "../utils/enum";
import { getOrderOutlet } from "../services/order.service";
import { asyncHandler } from "../middlewares/error.middleware";

// GET ALL OUTLETS
export const getAllOutletController = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search } = req.query;
  const pageNumber = Number(page) > 0 ? Number(page) : 1;
  const limitNumber = Number(limit) > 0 ? Number(limit) : 12;
  const searchTerm = typeof search === "string" ? search : "";

  const data = await getAllOutletService(pageNumber, limitNumber, searchTerm);

  return ResponseUtil.paginated(
    res,
    data.outlets,
    pageNumber,
    limitNumber,
    data.count,
    "berhasil mendapatkan data."
  );
});

// GET OUTLET BY ID
export const getOutletByIdController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const outlet = await getOutletById(id);

  return ResponseUtil.success(res, outlet, "Berhasil mendapatkan data", 200);
});

// GET PRODUCTS IN OUTLET (with pagination & search)
export const getOutletProductController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page, limit, search } = req.query;

  const pageNumber = Number(page) > 0 ? Number(page) : 1;
  const limitNumber = Number(limit) > 0 ? Number(limit) : 10;
  const searchTerm = typeof search === "string" ? search : "";

  const data = await getProductOutletService(id, {
    limit: limitNumber,
    page: pageNumber,
    search: searchTerm
  });

  return ResponseUtil.paginated(res, data.products, pageNumber, limitNumber, data.count);
});

// GET PRODUCT GOODS BY OUTLET
export const getOutletProductGoods = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const type = req.query.type

  if (!isValidEnumValue(Object.values(ProductType), type)) {
    return ResponseUtil.error(res, "Invalid product type", 400)
  }

  const products = await getProductByType(id, "GOODS")
  return ResponseUtil.success(res, products)
})

// GET ORDER GOODS BY OUTLET
export const getOutletOderGoods = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const order = await getOrderOutlet(id, "GOODS")

  return ResponseUtil.success(res, order)
})

// GET ORDER SERVICES BY OUTLET
export const getOutletOderService = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const order = await getOrderOutlet(id, "SERVICE")

  return ResponseUtil.success(res, order)
})

// GET DASHBOARD DATA BY OUTLET
export const getOutletDashboard = asyncHandler(async (req: Request, res: Response) => {
  const { outletId } = req.params
  const data = await getOutletDashboardService(outletId)

  return ResponseUtil.success(res, data)
})

// CREATE PRODUCT FOR OUTLET
export const createProductFoOutlet = asyncHandler(async (req: Request, res: Response) => {
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

  const priceNumber = parseInt(price, 10)
  const costPriceNumber = parseInt(costPrice, 10)
  const quantityNumber = parseInt(quantity, 10)

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
})