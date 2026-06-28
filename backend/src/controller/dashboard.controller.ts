import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { getDashboardSummaryService, getOrderStatsService } from "../service/dashboard.service";
import { ResponseUtil } from "../utils/response";

function getStartDate(period?: string): Date | undefined {
    if (!period || period === 'all') return undefined;
    const now = new Date();
    switch (period) {
        case "week":
            return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        case "month":
            return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        case "year":
            return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        default:
            return undefined;
    }
}

export const getDashboardSummaryController = asyncHandler(async (req: Request, res: Response) => {
    const outletId = String(req.query.outletId || "");
    if (!outletId) {
        return ResponseUtil.badRequest(res, 'Parameter outletId wajib diisi');
    }
    const period = String(req.query.period || "");
    const startDate = getStartDate(period);
    const endDate = period ? new Date() : undefined;
    const summary = await getDashboardSummaryService(outletId, startDate, endDate);
    return ResponseUtil.success(res, summary);
});

export const getOrderStatsController = asyncHandler(async (req: Request, res: Response) => {
    const outletId = String(req.query.outletId || "");
    if (!outletId) {
        return ResponseUtil.badRequest(res, 'Parameter outletId wajib diisi');
    }
    const { period } = req.query;
    const stats = await getOrderStatsService(outletId, (period as 'week' | 'month') || 'month');
    return ResponseUtil.success(res, stats);
});