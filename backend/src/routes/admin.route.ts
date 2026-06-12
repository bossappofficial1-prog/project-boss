import { Router } from "express";
import { adminController } from "../controller/admin.controller";
import {
  getAdminDashboardActivitiesController,
  getAdminDashboardInsightsController,
  getAdminDashboardRiskController,
} from "../controller/admin-dashboard.controller";
import {
  getBannersController,
  createBannerController,
  updateBannerController,
  deleteBannerController,
} from "../controller/banner.controller";
import { protect, authorize } from "../middleware/auth.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import {
  createBannerSchema,
  updateBannerSchema,
} from "../schemas/banner.schema";
import { getContainer } from "../container";

const router = Router();

router.use(protect);
router.use(authorize("ADMIN"));

const resolveAuditLog = () => getContainer().resolve("auditLogController");
const resolveReport = () => getContainer().resolve("adminReportController");
const resolveSetting = () =>
  getContainer().resolve("platformSettingController");
const resolveUserMgmt = () =>
  getContainer().resolve("userManagementController");

// Dashboard
router.get("/dashboard/overview", adminController.getDashboardOverview);
router.get("/dashboard/kpis-metrics", adminController.getMetricsKPIs);
router.get("/dashboard/revenue", adminController.revenueInRange);
router.get("/dashboard/v3/insights", getAdminDashboardInsightsController);
router.get("/dashboard/v3/risk-merchants", getAdminDashboardRiskController);
router.get("/dashboard/v3/activities", getAdminDashboardActivitiesController);

// Analytics
router.get("/analytics/revenue", adminController.getRevenueAnalytics);
router.get("/analytics/revenue-chart", adminController.getRevenueChart);
router.get("/analytics/revenue/insights", adminController.getRevenueInsights);
router.get("/analytics/transactions", adminController.getTransactionAnalytics);
router.get(
  "/platform-income/subscriptions",
  adminController.getSubscriptionIncome,
);
router.get("/activities/recent", adminController.getRecentActivities);
router.get("/activities", adminController.getAllActivities);

// Businesses
router.get("/businesses", adminController.getAllBusinesses);
router.get("/businesses/:businessId", adminController.getBusinessDetails);
router.put(
  "/businesses/:businessId/suspend",
  adminController.toggleBusinessSuspend,
);
router.delete("/businesses/:businessId", adminController.deleteBusiness);
router.post("/businesses/bulk/suspend", adminController.bulkSuspendBusinesses);
router.post(
  "/businesses/bulk/unsuspend",
  adminController.bulkUnsuspendBusinesses,
);
router.post("/businesses/bulk/delete", adminController.bulkDeleteBusinesses);

// Outlets
router.get("/outlets", adminController.getAllOutlets);
router.patch(
  "/outlets/:outletId/force-close",
  adminController.forceCloseOutlet,
);
router.delete("/outlets/:outletId", adminController.deleteOutlet);
router.post("/outlets/bulk/delete", adminController.bulkDeleteOutlets);

// Orders
router.get("/orders", adminController.getAllOrders);

// Subscription invoices
router.get(
  "/subscriptions/invoices",
  adminController.getSubscriptionInvoiceValidations,
);
router.post(
  "/subscriptions/invoices/:invoiceId/verify",
  adminController.verifySubscriptionInvoice,
);
router.post(
  "/subscriptions/invoices/:invoiceId/reject",
  adminController.rejectSubscriptionInvoice,
);
router.post(
  "/subscriptions/invoices/bulk/verify",
  adminController.bulkVerifyInvoices,
);
router.post(
  "/subscriptions/invoices/bulk/reject",
  adminController.bulkRejectInvoices,
);

// Users (DI-based)
router.get("/users", resolveUserMgmt().getAll);
router.get("/users/stats", resolveUserMgmt().getStats);
router.get("/users/:userId", resolveUserMgmt().getById);
router.put("/users/:userId/suspend", resolveUserMgmt().suspend);
router.put("/users/:userId/reactivate", resolveUserMgmt().reactivate);
router.delete("/users/:userId", resolveUserMgmt().delete);
router.post("/users/bulk/suspend", resolveUserMgmt().bulkSuspend);
router.post("/users/bulk/reactivate", resolveUserMgmt().bulkReactivate);

// Reports - specific routes BEFORE :reportId param
router.get("/reports", resolveReport().getAll);
router.post("/reports/generate", resolveReport().generate);
router.get("/reports/financial", adminController.getFinancialReports);
router.get("/reports/revenue", adminController.getRevenueReport);
router.get(
  "/reports/business-performance",
  adminController.getBusinessPerformanceReport,
);
router.get("/reports/:reportId/download", adminController.downloadReport);
router.get("/reports/:reportId", resolveReport().getById);
router.delete("/reports/:reportId", resolveReport().delete);

// Audit logs
router.get("/audit-logs", resolveAuditLog().getAll);
router.get("/audit-logs/stats", resolveAuditLog().getStats);
router.get(
  "/audit-logs/entity/:entityType/:entityId",
  resolveAuditLog().getByEntity,
);

// System
router.get("/system/logs", adminController.getSystemLogs);
router.get("/system/health", adminController.getSystemHealth);

// Support
router.get("/support/tickets", adminController.getSupportTickets);
router.put(
  "/support/tickets/:ticketId/status",
  adminController.updateTicketStatus,
);

// Settings (DI-based)
router.get("/settings", resolveSetting().getSettings);
router.put("/settings", resolveSetting().updateSettings);
router.get("/settings/:key", resolveSetting().getSettingByKey);
router.put("/settings/:key", resolveSetting().setSetting);

// Banners
router.get("/banners", getBannersController);
router.post(
  "/banners",
  validateSchema(createBannerSchema),
  createBannerController,
);
router.put(
  "/banners/:id",
  validateSchema(updateBannerSchema),
  updateBannerController,
);
router.delete("/banners/:id", deleteBannerController);

export default router;
