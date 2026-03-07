import { Router } from "express";
import { getDashboardSummaryController, getOrderStatsController } from "../controller/dashboard.controller";
import {
    getBusinessOverviewController,
    getBusinessOutletsController,
    getBusinessRecentOrdersController,
} from "../controller/business-dashboard.controller";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";

const dashboardRouter = Router();

dashboardRouter.get(
    "/summary",
    protect,
    authorize(UserRole.OWNER),
    getDashboardSummaryController
);

dashboardRouter.get(
    "/stats",
    protect,
    authorize(UserRole.OWNER),
    getOrderStatsController
);

dashboardRouter.get(
    "/business/overview",
    protect,
    authorize(UserRole.OWNER),
    getBusinessOverviewController
);

dashboardRouter.get(
    "/business/outlets",
    protect,
    authorize(UserRole.OWNER),
    getBusinessOutletsController
);

dashboardRouter.get(
    "/business/recent-orders",
    protect,
    authorize(UserRole.OWNER),
    getBusinessRecentOrdersController
);

export default dashboardRouter;