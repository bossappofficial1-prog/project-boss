import { Request, Response } from "express";
import { getTransactionListService } from "../service/transaction.service";
import { ResponseUtil } from "../utils";
import { HttpStatus } from "../constants/http-status";
import { asyncHandler } from "../middleware/error.middleware";

/**
 * Get list of transactions with filters
 * Support filtering by outlet, status, date range, and pagination
 */
export const getTransactionListController = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).storedUser?.id;

    if (!userId) {
        return ResponseUtil.unauthorized(res, "Unauthorized");
    }

    const {
        outletId,
        status,
        type, // 'INCOME', 'EXPENSE', or 'ALL'
        startDate,
        endDate,
        page = "1",
        limit = "10",
        q: query
    } = req.query;

    const result = await getTransactionListService({
        userId,
        outletId: outletId as string | undefined,
        status: status as string | undefined,
        type: type as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        query: query as string
    });


    return ResponseUtil.paginated<{ totals: any, items: any[] }>(
        res,
        { totals: result.totals, items: result.data },
        result.pagination.page,
        result.pagination.limit,
        result.pagination.total,
        "Berhasil mengambil daftar transaksi",
    )
});

/**
 * Get transaction by ID
 */
export const getTransactionByIdController = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).storedUser?.id;
    const { id } = req.params;

    if (!userId) {
        return ResponseUtil.unauthorized(res, "Unauthorized");
    }

    return ResponseUtil.success(res, { id }, HttpStatus.OK, "Transaction details");
});
