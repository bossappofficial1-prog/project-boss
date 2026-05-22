import { Router } from "express";
import {
  getDashboardSummaryController,
  getOrderStatsController,
} from "../controller/dashboard.controller";
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
  authorize(UserRole.OWNER, "MANAGER"),
  getDashboardSummaryController,
);

dashboardRouter.get(
  "/stats",
  protect,
  authorize(UserRole.OWNER, "MANAGER"),
  getOrderStatsController,
);

dashboardRouter.get(
  "/business/overview",
  protect,
  authorize(UserRole.OWNER, "MANAGER"),
  getBusinessOverviewController,
);

dashboardRouter.get(
  "/business/outlets",
  protect,
  authorize(UserRole.OWNER, "MANAGER"),
  getBusinessOutletsController,
);

dashboardRouter.get(
  "/business/recent-orders",
  protect,
  authorize(UserRole.OWNER, "MANAGER"),
  getBusinessRecentOrdersController,
);

export default dashboardRouter;
