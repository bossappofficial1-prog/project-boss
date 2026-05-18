import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { AdminService } from '../service/admin.service';
import { AdminV2Service } from '../service/adminv2.service';
import { subscriptionIncomeQuerySchema } from '../schemas/platform-income.schema';
import {
    adminSubscriptionInvoiceQuerySchema,
    adminSubscriptionInvoiceRejectSchema,
    parsePaymentStatuses,
} from '../schemas/subscription-invoice.schema';
import { SubscriptionInvoiceService } from '../service/subscription-invoice.service';
import { ensureString } from '../utils/request';
import { AppError } from '../errors/app-error';
import { HttpStatus } from '../constants/http-status';

class AdminController extends BaseController {
    getDashboardOverview = this.handler(async (req: Request, res: Response) => {
        const data = await AdminService.getDashboardOverview();
        return this.success(res, data);
    });

    getAllBusinesses = this.handler(async (req: Request, res: Response) => {
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

        return this.success(res, data);
    });

    getBusinessDetails = this.handler(async (req: Request, res: Response) => {
        const { businessId } = req.params;
        const data = await AdminService.getBusinessDetails(businessId as string);
        return this.success(res, data);
    });

    toggleBusinessSuspend = this.handler(async (req: Request, res: Response) => {
        const { businessId } = req.params;
        const { isSuspended } = req.body;

        if (typeof isSuspended !== 'boolean') {
            throw new AppError('isSuspended boolean is required in request body', HttpStatus.BAD_REQUEST);
        }

        const data = await AdminService.toggleBusinessSuspend(businessId as string, isSuspended);
        return this.success(res, data);
    });

    getAllOutlets = this.handler(async (req: Request, res: Response) => {
        const {
            page = 1,
            limit = 10,
            search,
            status
        } = req.query;

        const data = await AdminService.getAllOutlets({
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            search: search as string,
            status: status as string
        });

        return this.success(res, data);
    });

    forceCloseOutlet = this.handler(async (req: Request, res: Response) => {
        const { outletId } = req.params;
        const { isClosed } = req.body;

        if (typeof isClosed !== 'boolean') {
            throw new AppError('isClosed boolean is required in request body', HttpStatus.BAD_REQUEST);
        }

        const data = await AdminService.forceCloseOutlet(outletId as string, isClosed);
        return this.success(res, data);
    });

    getRevenueAnalytics = this.handler(async (req: Request, res: Response) => {
        const { period = 'monthly', startDate, endDate } = req.query;

        const data = await AdminService.getRevenueAnalytics({
            period: period as string,
            startDate: startDate as string,
            endDate: endDate as string
        });

        return this.success(res, data);
    });

    getTransactionAnalytics = this.handler(async (req: Request, res: Response) => {
        const { startDate, endDate } = req.query;

        const data = await AdminService.getTransactionAnalytics({
            startDate: startDate as string,
            endDate: endDate as string
        });

        return this.success(res, data);
    });

    getRevenueInsights = this.handler(async (_req: Request, res: Response) => {
        const data = await AdminService.getRevenueInsights();
        return this.success(res, data);
    });

    getSubscriptionIncome = this.handler(async (req: Request, res: Response) => {
        const { months } = subscriptionIncomeQuerySchema.parse(req.query);
        const data = await AdminService.getSubscriptionIncomeOverview({ months });
        return this.success(res, data);
    });

    getAllUsers = this.handler(async (req: Request, res: Response) => {
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

        return this.success(res, data);
    });

    updateUserStatus = this.handler(async (req: Request, res: Response) => {
        const { userId } = req.params;
        const { status } = req.body;

        if (!req.storedUser?.id) {
            throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

        const data = await AdminService.updateUserStatus(userId as string, status, req.storedUser.id);
        return this.success(res, data);
    });

    getFinancialReports = this.handler(async (req: Request, res: Response) => {
        const { startDate, endDate, reportType = 'summary' } = req.query;

        const data = await AdminService.getFinancialReports({
            startDate: startDate as string,
            endDate: endDate as string,
            reportType: reportType as string
        });

        return this.success(res, data);
    });

    getSystemLogs = this.handler(async (req: Request, res: Response) => {
        const {
            page = 1,
            limit = 50
        } = req.query;

        return this.success(res, {
            logs: [],
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total: 0,
                totalPages: 0
            }
        });
    });

    getSystemHealth = this.handler(async (_req: Request, res: Response) => {
        const data = await AdminService.getSystemHealth();
        return this.success(res, data);
    });

    getRevenueChart = this.handler(async (req: Request, res: Response) => {
        const { period = 'monthly', startDate, endDate } = req.query;

        const data = await AdminService.getRevenueAnalytics({
            period: period as string,
            startDate: startDate as string,
            endDate: endDate as string
        });

        return this.success(res, data);
    });

    getRecentActivities = this.handler(async (req: Request, res: Response) => {
        const { limit = 10 } = req.query;

        const data = await AdminService.getRecentActivities(parseInt(limit as string));
        return this.success(res, data);
    });

    getAllActivities = this.handler(async (req: Request, res: Response) => {
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

        return this.success(res, data);
    });

    getSupportTickets = this.handler(async (req: Request, res: Response) => {
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

        return this.success(res, data);
    });

    updateTicketStatus = this.handler(async (req: Request, res: Response) => {
        const { ticketId } = req.params;
        const { status } = req.body;

        if (!req.storedUser?.id) {
            throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

        const data = await AdminService.updateTicketStatus(ticketId as string, status, req.storedUser.id);
        return this.success(res, data);
    });

    getPlatformSettings = this.handler(async (_req: Request, res: Response) => {
        const settings = await AdminService.getPlatformSettings();
        return this.success(res, settings);
    });

    updatePlatformSettings = this.handler(async (req: Request, res: Response) => {
        const { settings } = req.body;

        if (!req.storedUser?.id) {
            throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

        const data = await AdminService.updatePlatformSettings(settings, req.storedUser.id);
        return this.success(res, data);
    });

    getReportsList = this.handler(async (_req: Request, res: Response) => {
        const data = await AdminService.getReportsList();
        return this.success(res, data);
    });

    getRevenueReport = this.handler(async (req: Request, res: Response) => {
        const { period = 'monthly', startDate, endDate } = req.query;

        const data = await AdminService.getRevenueReport({
            period: period as string,
            startDate: startDate as string,
            endDate: endDate as string
        });

        return this.success(res, data);
    });

    getBusinessPerformanceReport = this.handler(async (req: Request, res: Response) => {
        const { period = 'monthly', startDate, endDate, businessId } = req.query;

        const data = await AdminService.getBusinessPerformanceReport({
            period: period as string,
            startDate: startDate as string,
            endDate: endDate as string,
            businessId: businessId as string
        });

        return this.success(res, data);
    });

    generateReport = this.handler(async (req: Request, res: Response) => {
        const { type, period, startDate, endDate, businessId } = req.body;

        const data = await AdminService.generateReport({
            type,
            period,
            startDate,
            endDate,
            businessId
        });

        return this.success(res, data, HttpStatus.CREATED);
    });

    downloadReport = this.handler(async (req: Request, res: Response) => {
        const { reportId } = req.params;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.pdf"`);

        const mockPdfContent = Buffer.from(`Mock PDF Report: ${reportId}\nGenerated at: ${new Date().toISOString()}`);
        res.status(HttpStatus.OK).send(mockPdfContent);
    });

    getMetricsKPIs = this.handler(async (_req: Request, res: Response) => {
        const result = await AdminV2Service.getMetrics();
        return this.success(res, result);
    });

    revenueInRange = this.handler(async (req: Request, res: Response) => {
        const fromRaw = req.query.from;
        const toRaw = req.query.to;

        const defaultFrom = new Date().toISOString();
        const defaultTo = new Date();
        defaultTo.setHours(0, 0, 0, 0);

        const from = typeof fromRaw === 'string' ? fromRaw : defaultFrom;
        const to = typeof toRaw === 'string' ? toRaw : defaultTo.toISOString();
        const result = await AdminV2Service.getRevenueInRange(from, to);

        return this.success(res, result);
    });

    getSubscriptionInvoiceValidations = this.handler(async (req: Request, res: Response) => {
        const parsed = adminSubscriptionInvoiceQuerySchema.parse(req.query);
        const statusFilters = parsePaymentStatuses(parsed.status);

        const data = await SubscriptionInvoiceService.listInvoices({
            status: statusFilters,
            search: parsed.search?.trim() || undefined,
            page: parsed.page,
            limit: parsed.limit,
        });

        return this.success(res, data);
    });

    verifySubscriptionInvoice = this.handler(async (req: Request, res: Response) => {
        if (!req.storedUser?.id) {
            throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

        const invoiceId = ensureString(req.params?.invoiceId, 'invoiceId');
        const result = await SubscriptionInvoiceService.verifyInvoice(invoiceId);
        return this.success(res, result);
    });

    rejectSubscriptionInvoice = this.handler(async (req: Request, res: Response) => {
        if (!req.storedUser?.id) {
            throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

        const invoiceId = ensureString(req.params?.invoiceId, 'invoiceId');
        const { reason } = adminSubscriptionInvoiceRejectSchema.parse(req.body);

        const result = await SubscriptionInvoiceService.rejectInvoice(invoiceId, reason);
        return this.success(res, result);
    });

    deleteBusiness = this.handler(async (req: Request, res: Response) => {
        const { businessId } = req.params;
        const data = await AdminService.deleteBusiness(businessId as string);
        return this.success(res, data, HttpStatus.OK, "Bisnis berhasil dihapus");
    });

    deleteOutlet = this.handler(async (req: Request, res: Response) => {
        const { outletId } = req.params;
        const data = await AdminService.deleteOutlet(outletId as string);
        return this.success(res, data, HttpStatus.OK, "Outlet berhasil dihapus");
    });
}

export const adminController = new AdminController();