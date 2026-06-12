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
import { getContainer } from '../container';
import { AdminAnalyticsService } from '../service/admin-analytics.service';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(protect);
router.use(authorize('ADMIN'));

// Helper to get controllers from container
const getAuditLogController = () => getContainer().resolve('auditLogController');
const getReportController = () => getContainer().resolve('reportController');
const getPlatformSettingController = () => getContainer().resolve('platformSettingController');
const getUserManagementController = () => getContainer().resolve('userManagementController');

// Dashboard routes
router.get('/dashboard/overview', adminController.getDashboardOverview);
router.get('/dashboard/kpis-metrics', adminController.getMetricsKPIs);
router.get('/dashboard/revenue', adminController.revenueInRange);
router.get('/dashboard/v3/insights', getAdminDashboardInsightsController);
router.get('/dashboard/v3/risk-merchants', getAdminDashboardRiskController);
router.get('/dashboard/v3/activities', getAdminDashboardActivitiesController);

// Full analytics endpoint
router.get('/dashboard/analytics', async (req, res) => {
    try {
        const analyticsService = new AdminAnalyticsService();
        const data = await analyticsService.getFullAnalytics();
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/dashboard/analytics/clear-cache', async (req, res) => {
    try {
        const analyticsService = new AdminAnalyticsService();
        await analyticsService.clearCache();
        res.json({ success: true, message: 'Cache cleared' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Business management routes
router.get('/businesses', adminController.getAllBusinesses);
router.get('/businesses/:businessId', adminController.getBusinessDetails);
router.put('/businesses/:businessId/suspend', adminController.toggleBusinessSuspend);
router.delete('/businesses/:businessId', adminController.deleteBusiness);

// Bulk business operations
router.post('/businesses/bulk/suspend', (req, res) => adminController.bulkSuspendBusinesses(req, res));
router.post('/businesses/bulk/unsuspend', (req, res) => adminController.bulkUnsuspendBusinesses(req, res));
router.post('/businesses/bulk/delete', (req, res) => adminController.bulkDeleteBusinesses(req, res));

// Outlet management routes
router.get('/outlets', adminController.getAllOutlets);
router.patch('/outlets/:outletId/force-close', adminController.forceCloseOutlet);
router.delete('/outlets/:outletId', adminController.deleteOutlet);

// Bulk outlet operations
router.post('/outlets/bulk/delete', (req, res) => adminController.bulkDeleteOutlets(req, res));

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

// Bulk invoice operations
router.post('/subscriptions/invoices/bulk/verify', (req, res) => adminController.bulkVerifyInvoices(req, res));
router.post('/subscriptions/invoices/bulk/reject', (req, res) => adminController.bulkRejectInvoices(req, res));

// User management routes (new DI-based)
router.get('/users', (req, res) => getUserManagementController().getAll(req, res));
router.get('/users/stats', (req, res) => getUserManagementController().getStats(req, res));
router.get('/users/:userId', (req, res) => getUserManagementController().getById(req, res));
router.put('/users/:userId/suspend', (req, res) => getUserManagementController().suspend(req, res));
router.put('/users/:userId/reactivate', (req, res) => getUserManagementController().reactivate(req, res));
router.delete('/users/:userId', (req, res) => getUserManagementController().delete(req, res));
router.post('/users/bulk/suspend', (req, res) => getUserManagementController().bulkSuspend(req, res));
router.post('/users/bulk/reactivate', (req, res) => getUserManagementController().bulkReactivate(req, res));

// Report management routes (new DI-based)
router.get('/reports', (req, res) => getReportController().getAll(req, res));
router.post('/reports/generate', (req, res) => getReportController().generate(req, res));
router.get('/reports/:reportId', (req, res) => getReportController().getById(req, res));
router.delete('/reports/:reportId', (req, res) => getReportController().delete(req, res));

// Legacy report routes (keep for backward compatibility)
router.get('/reports/financial', adminController.getFinancialReports);
router.get('/reports/revenue', adminController.getRevenueReport);
router.get('/reports/business-performance', adminController.getBusinessPerformanceReport);
router.get('/reports/:reportId/download', adminController.downloadReport);

// Audit log routes
router.get('/audit-logs', (req, res) => getAuditLogController().getAll(req, res));
router.get('/audit-logs/stats', (req, res) => getAuditLogController().getStats(req, res));
router.get('/audit-logs/entity/:entityType/:entityId', (req, res) => getAuditLogController().getByEntity(req, res));

// System management routes
router.get('/system/logs', adminController.getSystemLogs);
router.get('/system/health', adminController.getSystemHealth);

// Support tickets
router.get('/support/tickets', adminController.getSupportTickets);
router.put('/support/tickets/:ticketId/status', adminController.updateTicketStatus);

// Platform settings (new DI-based)
router.get('/settings', (req, res) => getPlatformSettingController().getSettings(req, res));
router.put('/settings', (req, res) => getPlatformSettingController().updateSettings(req, res));
router.get('/settings/:key', (req, res) => getPlatformSettingController().getSettingByKey(req, res));
router.put('/settings/:key', (req, res) => getPlatformSettingController().setSetting(req, res));

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
