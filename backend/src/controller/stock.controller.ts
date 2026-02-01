import { Request, Response, NextFunction } from "express";
import {
  recordStockIn,
  recordStockInBulk,
  recordStockOut,
  adjustStock,
  recordReturn,
  getStockHistory,
  getLowStockProducts,
  recalculateHpp,
} from "../service/stock.service";
import {
  stockInSchema,
  stockInBulkSchema,
  stockOutSchema,
  stockAdjustmentSchema,
  stockReturnSchema,
  stockHistoryQuerySchema,
} from "../schemas/stock.schema";
import { HttpStatus } from "../constants/http-status";
import { AppError } from "../errors/app-error";

/**
 * POST /api/stock/in
 * Record incoming stock (purchase/restock)
 */
export async function stockInController(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = stockInSchema.parse(req.body);
    const result = await recordStockIn(validatedData);

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: "Stock IN berhasil dicatat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/stock/in-bulk
 * Record multiple incoming stock (purchase/restock)
 */
export async function stockInBulkController(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = stockInBulkSchema.parse(req.body);
    const result = await recordStockInBulk(validatedData);

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: "Batch Stock IN berhasil dicatat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/stock/out
 * Record outgoing stock (manual)
 */
export async function stockOutController(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = stockOutSchema.parse(req.body);
    const result = await recordStockOut(validatedData);

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: "Stock OUT berhasil dicatat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/stock/adjust
 * Manual stock adjustment
 */
export async function stockAdjustmentController(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = stockAdjustmentSchema.parse(req.body);
    const result = await adjustStock(validatedData);

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: "Stock adjustment berhasil dicatat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/stock/return
 * Record stock return
 */
export async function stockReturnController(req: Request, res: Response, next: NextFunction) {
  try {
    const validatedData = stockReturnSchema.parse(req.body);
    const result = await recordReturn(validatedData);

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: "Stock return berhasil dicatat",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/stock/history/:productGoodsId
 * Get stock movement history
 */
export async function getStockHistoryController(req: Request, res: Response, next: NextFunction) {
  try {
    const { productGoodsId } = req.params as { productGoodsId: string };
    const filters = {
      type: req.query.type as any,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await getStockHistory(productGoodsId, filters);

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/stock/low-stock/:outletId
 * Get products with low stock
 */
export async function getLowStockController(req: Request, res: Response, next: NextFunction) {
  try {
    const { outletId } = req.params;
    const products = await getLowStockProducts(outletId);

    res.status(HttpStatus.OK).json({
      success: true,
      data: products,
      total: products.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/stock/recalculate-hpp/:productGoodsId
 * Manually recalculate HPP
 */
export async function recalculateHppController(req: Request, res: Response, next: NextFunction) {
  try {
    const { productGoodsId } = req.params;
    const result = await recalculateHpp(productGoodsId);

    res.status(HttpStatus.OK).json({
      success: true,
      message: "HPP berhasil dihitung ulang",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
