import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { HttpStatus } from "../constants/http-status";
import { ProductCategoryService } from "../service/product-category.service";
import { ensureString } from "../utils/request";

export const createProductCategoryController = asyncHandler(async (req: Request, res: Response) => {
  const category = await ProductCategoryService.create(req.body);
  ResponseUtil.success(res, category, HttpStatus.CREATED);
});

export const getProductCategoriesByOutletController = asyncHandler(async (req: Request, res: Response) => {
  const outletId = ensureString(req.params.outletId, "outletId");
  const categories = await ProductCategoryService.findByOutletId(outletId);
  ResponseUtil.success(res, categories);
});

export const updateProductCategoryController = asyncHandler(async (req: Request, res: Response) => {
  const id = ensureString(req.params.id, "id");
  const category = await ProductCategoryService.update(id, req.body);
  ResponseUtil.success(res, category);
});

export const deleteProductCategoryController = asyncHandler(async (req: Request, res: Response) => {
  const id = ensureString(req.params.id, "id");
  await ProductCategoryService.delete(id);
  ResponseUtil.success(res, null, HttpStatus.NO_CONTENT);
});
