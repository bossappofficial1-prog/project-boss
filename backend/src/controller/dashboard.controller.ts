import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { getDashboardSummaryService, getOrderStatsService } from "../service/dashboard.service";
import { ResponseUtil } from "../utils/response";

export const getDashboardSummaryController = asyncHandler(async (req: Request, res: Response) => {
    // In a real multi-tenant app, you'd get the businessId from the authenticated user (req.user.business.id)
    const businessId = "dummy-business-id"; // Placeholder
    const summary = await getDashboardSummaryService(businessId);
    return ResponseUtil.success(res, summary);
});

export const getOrderStatsController = asyncHandler(async (req: Request, res: Response) => {
    const businessId = "dummy-business-id"; // Placeholder
    const { period } = req.query;
    const stats = await getOrderStatsService(businessId, period as 'week' | 'month');
    return ResponseUtil.success(res, stats);
});