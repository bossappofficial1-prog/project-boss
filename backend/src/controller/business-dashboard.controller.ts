import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { BusinessDashboardService } from "../service/business-dashboard.service";
import {
    businessOverviewQuerySchema,
    businessOutletsQuerySchema,
    businessRecentOrdersQuerySchema,
} from "../schemas/business-dashboard.schema";
import { db } from "../config/prisma";

/**
 * Helper: resolve businessId + businessName from authenticated user
 */
async function resolveBusinessContext(req: Request) {
    const businessId = req.storedUser?.businessId;
    if (!businessId) return null;

    const biz = await db.business.findUnique({
        where: { id: businessId },
        select: { id: true, name: true },
    });

    return biz;
}

/**
 * GET /dashboard/business/overview
 */
export const getBusinessOverviewController = asyncHandler(
    async (req: Request, res: Response) => {
        const biz = await resolveBusinessContext(req);
        if (!biz) {
            return ResponseUtil.badRequest(res, "Bisnis belum dibuat");
        }

        const query = businessOverviewQuerySchema.parse(req.query);
        const data = await BusinessDashboardService.getOverview(
            biz.id,
            biz.name,
            query.period
        );

        return ResponseUtil.success(res, data);
    }
);

/**
 * GET /dashboard/business/outlets
 */
export const getBusinessOutletsController = asyncHandler(
    async (req: Request, res: Response) => {
        const biz = await resolveBusinessContext(req);
        if (!biz) {
            return ResponseUtil.badRequest(res, "Bisnis belum dibuat");
        }

        const query = businessOutletsQuerySchema.parse(req.query);
        const data = await BusinessDashboardService.getOutlets(
            biz.id,
            query.period,
            query.top
        );

        return ResponseUtil.success(res, data);
    }
);

/**
 * GET /dashboard/business/recent-orders
 */
export const getBusinessRecentOrdersController = asyncHandler(
    async (req: Request, res: Response) => {
        const biz = await resolveBusinessContext(req);
        if (!biz) {
            return ResponseUtil.badRequest(res, "Bisnis belum dibuat");
        }

        const query = businessRecentOrdersQuerySchema.parse(req.query);
        const data = await BusinessDashboardService.getRecentOrders(
            biz.id,
            query.limit
        );

        return ResponseUtil.success(res, data);
    }
);
