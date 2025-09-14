import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { getDashboardSummaryService, getOrderStatsService } from "../service/dashboard.service";
import { ResponseUtil } from "../utils/response";

export const getDashboardSummaryController = asyncHandler(async (req: Request, res: Response) => {
    const outletId = String(req.query.outletId || "");
    if (!outletId) {
        return ResponseUtil.badRequest(res, 'Parameter outletId wajib diisi');
    }
    const summary = await getDashboardSummaryService(outletId);
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