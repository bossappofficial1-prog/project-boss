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

const router = Router();

router.use(protect);
router.use(authorize('ADMIN'));

const resolveAuditLog = () => getContainer().resolve('auditLogController');
const resolveReport = () => getContainer().resolve('adminReportController');
const resolveSetting = () => getContainer().resolve('platformSettingController');
const resolveUserMgmt = () => getContainer().resolve('userManagementController');

// Dashboard
router.get('/dashboard/overview', adminController.getDashboardOverview);
router.get('/dashboard/kpis-metrics', adminController.getMetricsKPIs);
router.get('/dashboard/revenue', adminController.revenueInRange);
router.get('/dashboard/v3/insights', getAdminDashboardInsightsController);
router.get('/dashboard/v3/risk-merchants', getAdminDashboardRiskController);
router.get('/dashboard/v3/activities', getAdminDashboardActivitiesController);

// Analytics
router.get('/analytics/revenue', adminController.getRevenueAnalytics);
router.get('/analytics/revenue-chart', adminController.getRevenueChart);
router.get('/analytics/revenue/insights', adminController.getRevenueInsights);
router.get('/analytics/transactions', adminController.getTransactionAnalytics);
router.get('/platform-income/subscriptions', adminController.getSubscriptionIncome);
router.get('/activities/recent', adminController.getRecentActivities);
router.get('/activities', adminController.getAllActivities);

// Businesses
router.get('/businesses', adminController.getAllBusinesses);
router.get('/businesses/:businessId', adminController.getBusinessDetails);
router.put('/businesses/:businessId/suspend', adminController.toggleBusinessSuspend);
router.delete('/businesses/:businessId', adminController.deleteBusiness);
router.post('/businesses/bulk/suspend', (req, res) => adminController.bulkSuspendBusinesses(req, res));
router.post('/businesses/bulk/unsuspend', (req, res) => adminController.bulkUnsuspendBusinesses(req, res));
router.post('/businesses/bulk/delete', (req, res) => adminController.bulkDeleteBusinesses(req, res));

// Outlets
router.get('/outlets', adminController.getAllOutlets);
router.patch('/outlets/:outletId/force-close', adminController.forceCloseOutlet);
router.delete('/outlets/:outletId', adminController.deleteOutlet);
router.post('/outlets/bulk/delete', (req, res) => adminController.bulkDeleteOutlets(req, res));

// Orders
router.get('/orders', adminController.getAllOrders);

// Subscription invoices
router.get('/subscriptions/invoices', adminController.getSubscriptionInvoiceValidations);
router.post('/subscriptions/invoices/:invoiceId/verify', adminController.verifySubscriptionInvoice);
router.post('/subscriptions/invoices/:invoiceId/reject', adminController.rejectSubscriptionInvoice);
router.post('/subscriptions/invoices/bulk/verify', (req, res) => adminController.bulkVerifyInvoices(req, res));
router.post('/subscriptions/invoices/bulk/reject', (req, res) => adminController.bulkRejectInvoices(req, res));

// Users (DI-based)
router.get('/users', (req, res) => resolveUserMgmt().getAll(req, res));
router.get('/users/stats', (req, res) => resolveUserMgmt().getStats(req, res));
router.get('/users/:userId', (req, res) => resolveUserMgmt().getById(req, res));
router.put('/users/:userId/suspend', (req, res) => resolveUserMgmt().suspend(req, res));
router.put('/users/:userId/reactivate', (req, res) => resolveUserMgmt().reactivate(req, res));
router.delete('/users/:userId', (req, res) => resolveUserMgmt().delete(req, res));
router.post('/users/bulk/suspend', (req, res) => resolveUserMgmt().bulkSuspend(req, res));
router.post('/users/bulk/reactivate', (req, res) => resolveUserMgmt().bulkReactivate(req, res));

// Reports - specific routes BEFORE :reportId param
router.get('/reports', (req, res) => resolveReport().getAll(req, res));
router.post('/reports/generate', (req, res) => resolveReport().generate(req, res));
router.get('/reports/financial', adminController.getFinancialReports);
router.get('/reports/revenue', adminController.getRevenueReport);
router.get('/reports/business-performance', adminController.getBusinessPerformanceReport);
router.get('/reports/:reportId/download', adminController.downloadReport);
router.get('/reports/:reportId', (req, res) => resolveReport().getById(req, res));
router.delete('/reports/:reportId', (req, res) => resolveReport().delete(req, res));

// Audit logs
router.get('/audit-logs', (req, res) => resolveAuditLog().getAll(req, res));
router.get('/audit-logs/stats', (req, res) => resolveAuditLog().getStats(req, res));
router.get('/audit-logs/entity/:entityType/:entityId', (req, res) => resolveAuditLog().getByEntity(req, res));

// System
router.get('/system/logs', adminController.getSystemLogs);
router.get('/system/health', adminController.getSystemHealth);

// Support
router.get('/support/tickets', adminController.getSupportTickets);
router.put('/support/tickets/:ticketId/status', adminController.updateTicketStatus);

// Settings (DI-based)
router.get('/settings', (req, res) => resolveSetting().getSettings(req, res));
router.put('/settings', (req, res) => resolveSetting().updateSettings(req, res));
router.get('/settings/:key', (req, res) => resolveSetting().getSettingByKey(req, res));
router.put('/settings/:key', (req, res) => resolveSetting().setSetting(req, res));

// Banners
router.get('/banners', getBannersController);
router.post('/banners', validateSchema(createBannerSchema), createBannerController);
router.put('/banners/:id', validateSchema(updateBannerSchema), updateBannerController);
router.delete('/banners/:id', deleteBannerController);

export default router;
