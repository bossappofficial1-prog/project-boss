import { Router } from 'express';
import {
    getDashboardOverviewController,
    getAllBusinessesController,
    getBusinessDetailsController,
    getRevenueAnalyticsController,
    getTransactionAnalyticsController,
    getAllUsersController,
    updateUserStatusController,
    getFinancialReportsController,
    getSystemLogsController,
    getSystemHealthController,
    getRevenueChartController,
    getSupportTicketsController,
    updateTicketStatusController,
    getPlatformSettingsController,
    updatePlatformSettingsController,
    getReportsListController,
    getRevenueReportController,
    getBusinessPerformanceReportController,
    generateReportController,
    downloadReportController,
    getRecentActivitiesController,
    getAllActivitiesController
} from '../controller/admin.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(protect);
router.use(authorize('ADMIN'));

// Dashboard routes
router.get('/dashboard/overview', getDashboardOverviewController);

// Business management routes
router.get('/businesses', getAllBusinessesController);
router.get('/businesses/:businessId', getBusinessDetailsController);

// Analytics routes
router.get('/analytics/revenue', getRevenueAnalyticsController);
router.get('/analytics/revenue-chart', getRevenueChartController);
router.get('/analytics/transactions', getTransactionAnalyticsController);
router.get('/activities/recent', getRecentActivitiesController);
router.get('/activities', getAllActivitiesController);

// User management routes
router.get('/users', getAllUsersController);
router.put('/users/:userId/status', updateUserStatusController);

// Financial reports
router.get('/reports/financial', getFinancialReportsController);
router.get('/reports', getReportsListController);
router.get('/reports/revenue', getRevenueReportController);
router.get('/reports/business-performance', getBusinessPerformanceReportController);
router.post('/reports/generate', generateReportController);
router.get('/reports/:reportId/download', downloadReportController);

// System management routes
router.get('/system/logs', getSystemLogsController);
router.get('/system/health', getSystemHealthController);

// Support tickets
router.get('/support/tickets', getSupportTicketsController);
router.put('/support/tickets/:ticketId/status', updateTicketStatusController);

// Platform settings
router.get('/settings', getPlatformSettingsController);
router.put('/settings', updatePlatformSettingsController);

export default router;
