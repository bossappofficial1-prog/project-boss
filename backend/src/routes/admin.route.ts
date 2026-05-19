import { Router } from 'express';
import { adminController } from '../controller/admin.controller';
import {
    getAdminDashboardActivitiesController,
    getAdminDashboardInsightsController,
    getAdminDashboardRiskController,
} from '../controller/admin-dashboard.controller';
import {
    getBannersController,
    createBannerController,
    updateBannerController,
    deleteBannerController
} from '../controller/banner.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { validateSchema } from '../middleware/zod.middleware';
import { createBannerSchema, updateBannerSchema } from '../schemas/banner.schema';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(protect);
router.use(authorize('ADMIN'));

// Dashboard routes
router.get('/dashboard/overview', adminController.getDashboardOverview);
router.get('/dashboard/kpis-metrics', adminController.getMetricsKPIs);
router.get('/dashboard/revenue', adminController.revenueInRange);
router.get('/dashboard/v3/insights', getAdminDashboardInsightsController);
router.get('/dashboard/v3/risk-merchants', getAdminDashboardRiskController);
router.get('/dashboard/v3/activities', getAdminDashboardActivitiesController);

// Business management routes
router.get('/businesses', adminController.getAllBusinesses);
router.get('/businesses/:businessId', adminController.getBusinessDetails);
router.put('/businesses/:businessId/suspend', adminController.toggleBusinessSuspend);
router.delete('/businesses/:businessId', adminController.deleteBusiness);

// Outlet management routes
router.get('/outlets', adminController.getAllOutlets);
router.patch('/outlets/:outletId/force-close', adminController.forceCloseOutlet);
router.delete('/outlets/:outletId', adminController.deleteOutlet);

// Order management routes
router.get('/orders', adminController.getAllOrders);

// Analytics routes
router.get('/analytics/revenue', adminController.getRevenueAnalytics);
router.get('/analytics/revenue-chart', adminController.getRevenueChart);
router.get('/analytics/revenue/insights', adminController.getRevenueInsights);
router.get('/analytics/transactions', adminController.getTransactionAnalytics);
router.get('/platform-income/subscriptions', adminController.getSubscriptionIncome);
router.get('/activities/recent', adminController.getRecentActivities);
router.get('/activities', adminController.getAllActivities);

// Subscription invoice validations
router.get('/subscriptions/invoices', adminController.getSubscriptionInvoiceValidations);
router.post('/subscriptions/invoices/:invoiceId/verify', adminController.verifySubscriptionInvoice);
router.post('/subscriptions/invoices/:invoiceId/reject', adminController.rejectSubscriptionInvoice);

// User management routes
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/status', adminController.updateUserStatus);

// Financial reports
router.get('/reports/financial', adminController.getFinancialReports);
router.get('/reports', adminController.getReportsList);
router.get('/reports/revenue', adminController.getRevenueReport);
router.get('/reports/business-performance', adminController.getBusinessPerformanceReport);
router.post('/reports/generate', adminController.generateReport);
router.get('/reports/:reportId/download', adminController.downloadReport);

// System management routes
router.get('/system/logs', adminController.getSystemLogs);
router.get('/system/health', adminController.getSystemHealth);

// Support tickets
router.get('/support/tickets', adminController.getSupportTickets);
router.put('/support/tickets/:ticketId/status', adminController.updateTicketStatus);

// Platform settings
router.get('/settings', adminController.getPlatformSettings);
router.put('/settings', adminController.updatePlatformSettings);

// Banners management
router.get('/banners', getBannersController);
router.post('/banners',
    validateSchema(createBannerSchema),
    createBannerController);
router.put('/banners/:id',
    validateSchema(updateBannerSchema),
    updateBannerController);
router.delete('/banners/:id', deleteBannerController);

export default router;
