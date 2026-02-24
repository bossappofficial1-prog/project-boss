import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { HttpStatus } from "../constants/http-status";
import { AdminDashboardService } from "../service/admin-dashboard.service";
import {
    adminDashboardActivityQuerySchema,
    adminDashboardInsightsQuerySchema,
    adminDashboardRiskQuerySchema,
} from "../schemas/admin-dashboard.schema";

export const getAdminDashboardInsightsController = asyncHandler(async (req: Request, res: Response) => {
    const filters = adminDashboardInsightsQuerySchema.parse(req.query);
    const data = await AdminDashboardService.getInsights(filters);
    return ResponseUtil.success(res, data, HttpStatus.OK);
});

export const getAdminDashboardRiskController = asyncHandler(async (req: Request, res: Response) => {
    const filters = adminDashboardRiskQuerySchema.parse(req.query);
    const data = await AdminDashboardService.getRiskyMerchants(filters);
    return ResponseUtil.success(res, data, HttpStatus.OK);
});

export const getAdminDashboardActivitiesController = asyncHandler(async (req: Request, res: Response) => {
    const filters = adminDashboardActivityQuerySchema.parse(req.query);
    const data = await AdminDashboardService.getRecentActivities(filters);
    return ResponseUtil.success(res, data, HttpStatus.OK);
});
