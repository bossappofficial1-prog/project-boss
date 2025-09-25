import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/response';
import { HttpStatus } from '../constants/http-status';
import { asyncHandler } from '../middleware/error.middleware';
import { AppError } from '../errors/app-error';
import { AdminService } from '../service/admin.service';

// === DASHBOARD OVERVIEW ===

export const getDashboardOverviewController = asyncHandler(async (req: Request, res: Response) => {
    const data = await AdminService.getDashboardOverview();
    return ResponseUtil.success(res, data, HttpStatus.OK);
});

// === BUSINESS MANAGEMENT ===

export const getAllBusinessesController = asyncHandler(async (req: Request, res: Response) => {
    const {
        page = 1,
        limit = 10,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const data = await AdminService.getAllBusinesses({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as string
    });

    return ResponseUtil.success(res, data, HttpStatus.OK);
});

export const getBusinessDetailsController = asyncHandler(async (req: Request, res: Response) => {
    const { businessId } = req.params;
    const data = await AdminService.getBusinessDetails(businessId);
    return ResponseUtil.success(res, data, HttpStatus.OK);
});

// === ANALYTICS & REPORTING ===

export const getRevenueAnalyticsController = asyncHandler(async (req: Request, res: Response) => {
    const { period = 'monthly', startDate, endDate } = req.query;

    const data = await AdminService.getRevenueAnalytics({
        period: period as string,
        startDate: startDate as string,
        endDate: endDate as string
    });

    return ResponseUtil.success(res, data, HttpStatus.OK);
});

export const getTransactionAnalyticsController = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    const data = await AdminService.getTransactionAnalytics({
        startDate: startDate as string,
        endDate: endDate as string
    });

    return ResponseUtil.success(res, data, HttpStatus.OK);
});

// === USER MANAGEMENT ===

export const getAllUsersController = asyncHandler(async (req: Request, res: Response) => {
    const {
        page = 1,
        limit = 10,
        role,
        search,
        status
    } = req.query;

    const data = await AdminService.getAllUsers({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        role: role as string,
        search: search as string,
        status: status as string
    });

    return ResponseUtil.success(res, data, HttpStatus.OK);
});

export const updateUserStatusController = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { status, notes } = req.body;

    if (!req.storedUser?.id) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const data = await AdminService.updateUserStatus(userId, status, req.storedUser.id);
    return ResponseUtil.success(res, data, HttpStatus.OK);
});

// === FINANCIAL MANAGEMENT ===

export const getFinancialReportsController = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, reportType = 'summary' } = req.query;

    const data = await AdminService.getFinancialReports({
        startDate: startDate as string,
        endDate: endDate as string,
        reportType: reportType as string
    });

    return ResponseUtil.success(res, data, HttpStatus.OK);
});

// === SYSTEM MANAGEMENT ===

export const getSystemLogsController = asyncHandler(async (req: Request, res: Response) => {
    const {
        page = 1,
        limit = 50,
        action,
        adminId,
        startDate,
        endDate
    } = req.query;

    // Since AdminLog model doesn't exist, return empty results
    // This can be implemented later with a proper logging system
    return ResponseUtil.success(res, {
        logs: [],
        pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: 0,
            totalPages: 0
        }
    }, HttpStatus.OK);
});

export const getSystemHealthController = asyncHandler(async (req: Request, res: Response) => {
    const data = await AdminService.getSystemHealth();
    return ResponseUtil.success(res, data, HttpStatus.OK);
});

// === REVENUE CHART DATA ===

export const getRevenueChartController = asyncHandler(async (req: Request, res: Response) => {
    const { period = 'monthly', startDate, endDate } = req.query;

    const data = await AdminService.getRevenueAnalytics({
        period: period as string,
        startDate: startDate as string,
        endDate: endDate as string
    });

    return ResponseUtil.success(res, data, HttpStatus.OK);
});

// === ACTIVITIES MANAGEMENT ===

export const getRecentActivitiesController = asyncHandler(async (req: Request, res: Response) => {
    const { limit = 10 } = req.query;

    const data = await AdminService.getRecentActivities(parseInt(limit as string));
    return ResponseUtil.success(res, data, HttpStatus.OK);
});

export const getAllActivitiesController = asyncHandler(async (req: Request, res: Response) => {
    const {
        page = 1,
        limit = 20,
        search = '',
        status = '',
        type = ''
    } = req.query;

    const data = await AdminService.getAllActivities({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        status: status as string,
        type: type as string
    });

    return ResponseUtil.success(res, data, HttpStatus.OK);
});

// === SUPPORT & DISPUTE MANAGEMENT ===

export const getSupportTicketsController = asyncHandler(async (req: Request, res: Response) => {
    const {
        page = 1,
        limit = 10,
        status,
        priority,
        search
    } = req.query;

    const data = await AdminService.getSupportTickets({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string,
        priority: priority as string,
        search: search as string
    });

    return ResponseUtil.success(res, data, HttpStatus.OK);
});

export const updateTicketStatusController = asyncHandler(async (req: Request, res: Response) => {
    const { ticketId } = req.params;
    const { status, notes } = req.body;

    if (!req.storedUser?.id) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const data = await AdminService.updateTicketStatus(ticketId, status, req.storedUser.id);
    return ResponseUtil.success(res, data, HttpStatus.OK);
});

// === SETTINGS & CONFIGURATION ===

export const getPlatformSettingsController = asyncHandler(async (req: Request, res: Response) => {
    const settings = await AdminService.getPlatformSettings();
    return ResponseUtil.success(res, settings, HttpStatus.OK);
});

export const updatePlatformSettingsController = asyncHandler(async (req: Request, res: Response) => {
    const { settings } = req.body;

    if (!req.storedUser?.id) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const data = await AdminService.updatePlatformSettings(settings, req.storedUser.id);
    return ResponseUtil.success(res, data, HttpStatus.OK);
});

// === FINANCIAL REPORTS ===

export const getReportsListController = asyncHandler(async (req: Request, res: Response) => {
    const data = await AdminService.getReportsList();
    return ResponseUtil.success(res, data, HttpStatus.OK);
});

export const getRevenueReportController = asyncHandler(async (req: Request, res: Response) => {
    const { period = 'monthly', startDate, endDate } = req.query;

    const data = await AdminService.getRevenueReport({
        period: period as string,
        startDate: startDate as string,
        endDate: endDate as string
    });

    return ResponseUtil.success(res, data, HttpStatus.OK);
});

export const getBusinessPerformanceReportController = asyncHandler(async (req: Request, res: Response) => {
    const { period = 'monthly', startDate, endDate, businessId } = req.query;

    const data = await AdminService.getBusinessPerformanceReport({
        period: period as string,
        startDate: startDate as string,
        endDate: endDate as string,
        businessId: businessId as string
    });

    return ResponseUtil.success(res, data, HttpStatus.OK);
});

export const generateReportController = asyncHandler(async (req: Request, res: Response) => {
    const { type, period, startDate, endDate, businessId } = req.body;

    const data = await AdminService.generateReport({
        type,
        period,
        startDate,
        endDate,
        businessId
    });

    return ResponseUtil.success(res, data, HttpStatus.CREATED);
});

export const downloadReportController = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;

    // TODO: Implement actual PDF generation and download
    // For now, return a simple JSON response indicating the report would be downloaded
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.pdf"`);

    // This is a placeholder - in a real implementation, you'd generate and stream the actual PDF
    const mockPdfContent = Buffer.from(`Mock PDF Report: ${reportId}\nGenerated at: ${new Date().toISOString()}`);
    res.status(HttpStatus.OK).send(mockPdfContent);
});