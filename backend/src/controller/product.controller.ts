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
    getProductByBarcodeService,
    getProductsByOutletIdService,
    searchProductsByNameService,
    updateProductService,
    generateProductImportTemplateService,
    exportProductsToExcelService
} from "../service/product.service";
import { UserRole } from "@prisma/client";
import Console from "../utils/logger";
import { ensureString } from "../utils/request";

export const getProductImportTemplateController = asyncHandler(async (req: Request, res: Response) => {
    const workbook = await generateProductImportTemplateService();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=template_import_produk.xlsx');
    await workbook.xlsx.write(res);
    res.end();
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
    const id = ensureString(req.params?.id, 'id');
    const product = await getProductByIdService(id);
    return ResponseUtil.success(res, product);
});

export const getProductByBarcodeController = asyncHandler(async (req: Request, res: Response) => {
    const code = ensureString(req.params?.code, 'code');
    const outletId = ensureString(req.query?.outletId, 'outletId');
    const product = await getProductByBarcodeService(code, outletId);
    return ResponseUtil.success(res, product);
});

export const getProductsByOutletIdController = asyncHandler(async (req: Request, res: Response) => {
    const outletId = ensureString(req.params?.outletId, 'outletId');
    const { q, accessed, page, limit, type: productType } = req.query;
    const pageNumber = Math.max(parseInt(page as string, 10) || 1, 1);
    const defaultLimit = 10;
    const parsedLimit = parseInt(limit as string, 10);
    const limitNumber = Math.min(Math.max(parsedLimit || defaultLimit, 1), 100);
    const accessedRole = typeof accessed === 'string' ? accessed : undefined;
    const searchQuery = typeof q === 'string' ? q : undefined;

    const { data, total } = await getProductsByOutletIdService(outletId, productType as any, {
        q: searchQuery,
        accessed: accessedRole,
        page: pageNumber,
        limit: limitNumber
    });


    return ResponseUtil.paginated(res, data, pageNumber, limitNumber, total);
});

export const updateProductController = asyncHandler(async (req: Request, res: Response) => {
    const id = ensureString(req.params?.id, 'id');
    const payload = req.body;
    console.log(payload)
    const product = await updateProductService(id, payload);
    return ResponseUtil.success(res, product);
});

export const deleteProductController = asyncHandler(async (req: Request, res: Response) => {
    const id = ensureString(req.params?.id, 'id');
    const product = await deleteProductService(id);
    return ResponseUtil.success(res, product);
});

export const exportProductsController = asyncHandler(async (req: Request, res: Response) => {
    const outletId = ensureString(req.params?.outletId, 'outletId');
    const { type, search } = req.query;

    const workbook = await exportProductsToExcelService(outletId, {
        type: type as 'GOODS' | 'SERVICE' | undefined,
        search: search as string | undefined
    });

    const filename = type === 'GOODS' ? 'data_produk.xlsx' :
        type === 'SERVICE' ? 'data_jasa.xlsx' :
            'data_produk_dan_jasa.xlsx';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    await (workbook as any).xlsx.write(res);
    res.end();
});