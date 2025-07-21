import { Router } from "express";
import { getDashboardSummaryController, getOrderStatsController } from "../controller/dashboard.controller";
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

export default dashboardRouter;