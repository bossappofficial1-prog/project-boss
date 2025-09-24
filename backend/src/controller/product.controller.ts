import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { AppError } from "../errors/app-error";
import { ResponseUtil } from "../utils/response";
import { HttpStatus } from "../constants/http-status";
import {
    bulkCreateProductsFromExcelService,
    createProductService,
    deleteProductService,
    getProductByIdService,
    getProductsByOutletIdService,
    searchProductsByNameService,
    updateProductService,
    generateProductImportTemplateService,
    exportProductsToExcelService
} from "../service/product.service";
import { UserRole } from "@prisma/client";

export const getProductImportTemplateController = asyncHandler(async (req: Request, res: Response) => {
    const buffer = generateProductImportTemplateService();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=product_import_template.xlsx');
    res.send(buffer);
});

export const searchProductsByNameController = asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.query;
    const products = await searchProductsByNameService(name as string);
    return ResponseUtil.success(res, products);
});

export const bulkCreateProductsController = asyncHandler(async (req: Request, res: Response) => {
    const { outletId } = req.body;

    if (!req.file) {
        throw new AppError("File tidak ditemukan.", HttpStatus.BAD_REQUEST);
    }

    const result = await bulkCreateProductsFromExcelService(req.file, outletId);
    return ResponseUtil.success(res, result, HttpStatus.CREATED);
});

export const createProductController = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    const product = await createProductService(payload);
    return ResponseUtil.success(res, product, HttpStatus.CREATED);
});

export const getProductByIdController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await getProductByIdService(id);
    return ResponseUtil.success(res, product);
});

export const getProductsByOutletIdController = asyncHandler(async (req: Request, res: Response) => {
    const { outletId } = req.params;
    const { q, accessed } = req.query;
    const products = await getProductsByOutletIdService(outletId, q as string, accessed as UserRole);
    return ResponseUtil.success(res, products);
});

export const updateProductController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body;
    const product = await updateProductService(id, payload);
    return ResponseUtil.success(res, product);
});

export const deleteProductController = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await deleteProductService(id);
    return ResponseUtil.success(res, product);
});

export const exportProductsController = asyncHandler(async (req: Request, res: Response) => {
    const { outletId } = req.params;
    const { type, search } = req.query;

    const buffer = await exportProductsToExcelService(outletId, {
        type: type as 'GOODS' | 'SERVICE' | undefined,
        search: search as string | undefined
    });

    const filename = type === 'GOODS' ? 'data_produk.xlsx' :
        type === 'SERVICE' ? 'data_jasa.xlsx' :
            'data_produk_dan_jasa.xlsx';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(buffer);
});