import { Request, Response } from "express";
import { getTransactionListService } from "../service/transaction.service";
import { ResponseUtil } from "../utils";
import { HttpStatus } from "../constants/http-status";

/**
 * Get list of transactions with filters
 * Support filtering by outlet, status, date range, and pagination
 */
export const getTransactionListController = async (req: Request, res: Response) => {
    try {
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
        });

        // Return with pagination using custom response format
        return res.status(200).json({
            success: true,
            message: "Berhasil mengambil daftar transaksi",
            data: result.data,
            pagination: result.pagination,
            timestamp: new Date().toISOString(),
            path: req.originalUrl
        });
    } catch (error: any) {
        console.error("Error in getTransactionListController:", error);
        return ResponseUtil.error(
            res, 
            error.message || "Gagal mengambil daftar transaksi", 
            undefined,
            error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
};

/**
 * Get transaction by ID
 */
export const getTransactionByIdController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).storedUser?.id;
        const { id } = req.params;

        if (!userId) {
            return ResponseUtil.unauthorized(res, "Unauthorized");
        }

        // This would need a service function - simplified for now
        return ResponseUtil.success(res, { id }, HttpStatus.OK, "Transaction details");
    } catch (error: any) {
        console.error("Error in getTransactionByIdController:", error);
        return ResponseUtil.error(
            res, 
            error.message || "Gagal mengambil detail transaksi", 
            undefined,
            error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
};
