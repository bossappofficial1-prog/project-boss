import { HttpStatus } from "../constants/http-status";
import { AppError } from "../errors/app-error";
import { AdminRepository } from "../repositories/admin.repository";

export class AdminService {
    // === DASHBOARD OVERVIEW ===

    static async getDashboardOverview() {
        const [metrics, activities] = await Promise.all([
            AdminRepository.getDashboardMetrics(),
            AdminRepository.getRecentActivities(8)
        ]);

        return {
            metrics: {
                ...metrics,
                activeBusinesses: metrics.totalBusinesses // For now, count all as active
            },
            recentActivities: activities
        };
    }

    // === BUSINESS MANAGEMENT ===

    static async getAllBusinesses(options: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
    }) {
        const {
            page = 1,
            limit = 10,
            status,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const { businesses, total } = await AdminRepository.getAllBusinesses({
            page,
            limit,
            status,
            search,
            sortBy,
            sortOrder
        });

        // Add totalOrders to each business
        const businessesWithOrders = businesses.map(business => ({
            ...business,
            _count: {
                ...business._count,
                orders: business.outlets?.reduce((sum, outlet) => sum + (outlet._count?.orders || 0), 0) || 0
            }
        }));

        return {
            businesses: businessesWithOrders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async getBusinessDetails(businessId: string) {
        // Validate businessId
        if (!businessId) {
            throw new AppError('Business ID is required', HttpStatus.BAD_REQUEST);
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(businessId)) {
            throw new AppError('Invalid business ID format', HttpStatus.BAD_REQUEST);
        }

        const business = await AdminRepository.getBusinessDetails(businessId);

        if (!business) {
            throw new AppError('Business not found', HttpStatus.NOT_FOUND);
        }

        const statistics = await AdminRepository.getBusinessStatistics(businessId);

        return {
            business,
            statistics: {
                ...statistics,
                totalOrders: business.outlets.reduce((sum, outlet) => sum + (outlet._count?.orders || 0), 0),
                totalOutlets: business._count.outlets,
                totalProducts: business.outlets.reduce((sum, outlet) => sum + (outlet._count?.products || 0), 0)
            }
        };
    }

    // === ANALYTICS & REPORTING ===

    static async getRevenueAnalytics(options: {
        period?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const { period = 'monthly', startDate, endDate } = options;

        // Validate period parameter
        const allowedPeriods = ['monthly', 'weekly', 'daily'];
        if (!allowedPeriods.includes(period)) {
            throw new AppError(`Invalid period. Must be one of: ${allowedPeriods.join(', ')}`, HttpStatus.BAD_REQUEST);
        }

        // Validate date parameters if provided
        let start: Date | undefined;
        let end: Date | undefined;

        if (startDate) {
            start = new Date(startDate);
            if (isNaN(start.getTime())) {
                throw new AppError('Invalid startDate format. Use ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)', HttpStatus.BAD_REQUEST);
            }
        }

        if (endDate) {
            end = new Date(endDate);
            if (isNaN(end.getTime())) {
                throw new AppError('Invalid endDate format. Use ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)', HttpStatus.BAD_REQUEST);
            }
        }

        // Validate date range if both dates are provided
        if (start && end && start >= end) {
            throw new AppError('startDate must be before endDate', HttpStatus.BAD_REQUEST);
        }

        const analytics = await AdminRepository.getRevenueAnalytics({
            period,
            startDate: start,
            endDate: end
        });

        return analytics;
    }

    static async getRevenueInsights() {
        return AdminRepository.getRevenueInsights();
    }

    static async getSubscriptionIncomeOverview(options: { months?: number }) {
        const months = options.months ?? 12;

        if (isNaN(months) || months < 1 || months > 24) {
            throw new AppError('months must be between 1 and 24', HttpStatus.BAD_REQUEST);
        }

        return AdminRepository.getSubscriptionIncomeOverview({ months });
    }

    static async getTransactionAnalytics(options: {
        startDate?: string;
        endDate?: string;
    }) {
        const { startDate, endDate } = options;

        // Validate date parameters if provided
        let start: Date | undefined;
        let end: Date | undefined;

        if (startDate) {
            start = new Date(startDate);
            if (isNaN(start.getTime())) {
                throw new AppError('Invalid startDate format. Use ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)', HttpStatus.BAD_REQUEST);
            }
        }

        if (endDate) {
            end = new Date(endDate);
            if (isNaN(end.getTime())) {
                throw new AppError('Invalid endDate format. Use ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)', HttpStatus.BAD_REQUEST);
            }
        }

        // Validate date range if both dates are provided
        if (start && end && start >= end) {
            throw new AppError('startDate must be before endDate', HttpStatus.BAD_REQUEST);
        }

        const analytics = await AdminRepository.getTransactionAnalytics({
            startDate: start,
            endDate: end
        });

        return {
            summary: {
                totalTransactions: analytics.totalTransactions,
                successfulTransactions: analytics.successfulTransactions,
                failedTransactions: analytics.failedTransactions,
                successRate: analytics.totalTransactions > 0 ? (analytics.successfulTransactions / analytics.totalTransactions) * 100 : 0
            },
            transactionsByStatus: analytics.transactionsByStatus,
            transactionsByHour: analytics.transactionsByHour
        };
    }

    // === ACTIVITIES MANAGEMENT ===

    static async getRecentActivities(limit: number = 10) {
        return await AdminRepository.getRecentActivities(limit);
    }

    static async getAllActivities(options: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        type?: string;
    }) {
        const {
            page = 1,
            limit = 20,
            search = '',
            status = '',
            type = ''
        } = options;

        return await AdminRepository.getAllActivities({
            page,
            limit,
            search,
            status,
            type
        });
    }

    // === USER MANAGEMENT ===

    static async getAllUsers(options: {
        page?: number;
        limit?: number;
        role?: string;
        search?: string;
        status?: string;
    }) {
        const {
            page = 1,
            limit = 10,
            role,
            search,
            status
        } = options;

        // Validate page parameter
        if (isNaN(page) || page < 1) {
            throw new AppError('Page must be a positive integer', HttpStatus.BAD_REQUEST);
        }

        // Validate limit parameter
        if (isNaN(limit) || limit < 1 || limit > 100) {
            throw new AppError('Limit must be a positive integer between 1 and 100', HttpStatus.BAD_REQUEST);
        }

        // Validate role parameter if provided
        const allowedRoles = ['ADMIN', 'OWNER', 'CUSTOMER'];
        if (role && role !== "all" && !allowedRoles.includes(role)) {
            throw new AppError(`Invalid role. Must be one of: ${allowedRoles.join(', ')}`, HttpStatus.BAD_REQUEST);
        }

        // Validate status parameter if provided
        const allowedStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'];
        if (status && status !== "all" && !allowedStatuses.includes(status)) {
            throw new AppError(`Invalid status. Must be one of: ${allowedStatuses.join(', ')}`, HttpStatus.BAD_REQUEST);
        }

        // Validate search parameter if provided
        if (search && typeof search !== 'string') {
            throw new AppError('Search parameter must be a string', HttpStatus.BAD_REQUEST);
        }

        const { users, total } = await AdminRepository.getAllUsers({
            page,
            limit,
            ...(role !== "all" ? { role } : { role: undefined }),
            search,
            status
        });

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async updateUserStatus(userId: string, status: string, adminId: string) {
        // Validate userId
        if (!userId) {
            throw new AppError('User ID is required', HttpStatus.BAD_REQUEST);
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
            throw new AppError('Invalid user ID format', HttpStatus.BAD_REQUEST);
        }

        // Validate status
        if (!status) {
            throw new AppError('Status is required', HttpStatus.BAD_REQUEST);
        }

        const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
        if (!validStatuses.includes(status)) {
            throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, HttpStatus.BAD_REQUEST);
        }

        if (!adminId) {
            throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

        try {
            const user = await AdminRepository.updateUserStatus(userId, status);
            return {
                message: `User status update requested (${status})`,
                user: {
                    ...user,
                    status // Return the requested status even though it's not stored
                }
            };
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new AppError('User not found', HttpStatus.NOT_FOUND);
            }
            throw error;
        }
    }

    // === FINANCIAL MANAGEMENT ===

    static async getFinancialReports(options: {
        startDate?: string;
        endDate?: string;
        reportType?: string;
    }) {
        const { startDate, endDate, reportType = 'summary' } = options;

        // Validate reportType parameter
        const allowedReportTypes = ['summary', 'detailed'];
        if (!allowedReportTypes.includes(reportType)) {
            throw new AppError(`Invalid report type. Must be one of: ${allowedReportTypes.join(', ')}`, HttpStatus.BAD_REQUEST);
        }

        // Validate date parameters if provided
        let start: Date | undefined;
        let end: Date | undefined;

        if (startDate) {
            start = new Date(startDate);
            if (isNaN(start.getTime())) {
                throw new AppError('Invalid startDate format. Use ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)', HttpStatus.BAD_REQUEST);
            }
        }

        if (endDate) {
            end = new Date(endDate);
            if (isNaN(end.getTime())) {
                throw new AppError('Invalid endDate format. Use ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)', HttpStatus.BAD_REQUEST);
            }
        }

        // Validate date range if both dates are provided
        if (start && end && start >= end) {
            throw new AppError('startDate must be before endDate', HttpStatus.BAD_REQUEST);
        }

        const reports = await AdminRepository.getFinancialReports({
            startDate: start,
            endDate: end,
            reportType
        });

        if (!reports) {
            throw new AppError('Invalid report type', HttpStatus.BAD_REQUEST);
        }

        return reports;
    }

    // === SYSTEM MANAGEMENT ===

    static async getSystemHealth() {
        return await AdminRepository.getSystemHealth();
    }

    // === SUPPORT & DISPUTE MANAGEMENT ===

    static async getSupportTickets(options: {
        page?: number;
        limit?: number;
        status?: string;
        priority?: string;
        search?: string;
    }) {
        const {
            page = 1,
            limit = 10,
            status,
            priority,
            search
        } = options;

        // Validate page parameter
        if (isNaN(page) || page < 1) {
            throw new AppError('Page must be a positive integer', HttpStatus.BAD_REQUEST);
        }

        // Validate limit parameter
        if (isNaN(limit) || limit < 1 || limit > 100) {
            throw new AppError('Limit must be a positive integer between 1 and 100', HttpStatus.BAD_REQUEST);
        }

        // Validate status parameter if provided
        const allowedStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
        if (status && !allowedStatuses.includes(status)) {
            throw new AppError(`Invalid status. Must be one of: ${allowedStatuses.join(', ')}`, HttpStatus.BAD_REQUEST);
        }

        // Validate priority parameter if provided
        const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        if (priority && !allowedPriorities.includes(priority)) {
            throw new AppError(`Invalid priority. Must be one of: ${allowedPriorities.join(', ')}`, HttpStatus.BAD_REQUEST);
        }

        // Validate search parameter if provided
        if (search && typeof search !== 'string') {
            throw new AppError('Search parameter must be a string', HttpStatus.BAD_REQUEST);
        }

        const { tickets, total } = await AdminRepository.getSupportTickets({
            page,
            limit,
            status,
            search
        });

        return {
            tickets,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    static async updateTicketStatus(ticketId: string, status: string, adminId: string) {
        // Validate ticketId
        if (!ticketId) {
            throw new AppError('Ticket ID is required', HttpStatus.BAD_REQUEST);
        }

        // Validate UUID format for ticketId
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(ticketId)) {
            throw new AppError('Invalid ticket ID format', HttpStatus.BAD_REQUEST);
        }

        // Validate status
        if (!status) {
            throw new AppError('Status is required', HttpStatus.BAD_REQUEST);
        }

        const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, HttpStatus.BAD_REQUEST);
        }

        if (!adminId) {
            throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

        const order = await AdminRepository.updateTicketStatus(ticketId, status);

        return {
            message: `Ticket status updated to ${status}`,
            order
        };
    }

    // === SETTINGS & CONFIGURATION ===

    static async getPlatformSettings() {
        // For now, return hardcoded settings
        // In a real implementation, you'd have a settings table
        const settings = {
            platform: {
                name: 'Project Boss',
                version: '1.0.0',
                maintenance: false
            },
            fees: {
                appFeePercentage: 2.0,
                midtransFee: 4000,
                minimumWithdrawal: 50000
            },
            notifications: {
                whatsappEnabled: true,
                emailEnabled: true
            },
            limits: {
                maxBusinessesPerOwner: 5,
                maxOutletsPerBusiness: 10,
                maxProductsPerOutlet: 100
            }
        };

        return settings;
    }

    static async updatePlatformSettings(settings: any, adminId: string) {
        // Validate settings object
        if (!settings || typeof settings !== 'object') {
            throw new AppError('Settings object is required', HttpStatus.BAD_REQUEST);
        }

        // Validate platform settings if provided
        if (settings.platform) {
            const { name, version, maintenance } = settings.platform;
            if (name && typeof name !== 'string') {
                throw new AppError('Platform name must be a string', HttpStatus.BAD_REQUEST);
            }
            if (version && typeof version !== 'string') {
                throw new AppError('Platform version must be a string', HttpStatus.BAD_REQUEST);
            }
            if (maintenance !== undefined && typeof maintenance !== 'boolean') {
                throw new AppError('Platform maintenance must be a boolean', HttpStatus.BAD_REQUEST);
            }
        }

        // Validate fees settings if provided
        if (settings.fees) {
            const { appFeePercentage, midtransFee, minimumWithdrawal } = settings.fees;
            if (appFeePercentage !== undefined && (typeof appFeePercentage !== 'number' || appFeePercentage < 0 || appFeePercentage > 100)) {
                throw new AppError('App fee percentage must be a number between 0 and 100', HttpStatus.BAD_REQUEST);
            }
            if (midtransFee !== undefined && (typeof midtransFee !== 'number' || midtransFee < 0)) {
                throw new AppError('Midtrans fee must be a positive number', HttpStatus.BAD_REQUEST);
            }
            if (minimumWithdrawal !== undefined && (typeof minimumWithdrawal !== 'number' || minimumWithdrawal < 0)) {
                throw new AppError('Minimum withdrawal must be a positive number', HttpStatus.BAD_REQUEST);
            }
        }

        // Validate notifications settings if provided
        if (settings.notifications) {
            const { whatsappEnabled, emailEnabled } = settings.notifications;
            if (whatsappEnabled !== undefined && typeof whatsappEnabled !== 'boolean') {
                throw new AppError('WhatsApp enabled must be a boolean', HttpStatus.BAD_REQUEST);
            }
            if (emailEnabled !== undefined && typeof emailEnabled !== 'boolean') {
                throw new AppError('Email enabled must be a boolean', HttpStatus.BAD_REQUEST);
            }
        }

        // Validate limits settings if provided
        if (settings.limits) {
            const { maxBusinessesPerOwner, maxOutletsPerBusiness, maxProductsPerOutlet } = settings.limits;
            if (maxBusinessesPerOwner !== undefined && (typeof maxBusinessesPerOwner !== 'number' || maxBusinessesPerOwner < 1)) {
                throw new AppError('Max businesses per owner must be a positive number', HttpStatus.BAD_REQUEST);
            }
            if (maxOutletsPerBusiness !== undefined && (typeof maxOutletsPerBusiness !== 'number' || maxOutletsPerBusiness < 1)) {
                throw new AppError('Max outlets per business must be a positive number', HttpStatus.BAD_REQUEST);
            }
            if (maxProductsPerOutlet !== undefined && (typeof maxProductsPerOutlet !== 'number' || maxProductsPerOutlet < 1)) {
                throw new AppError('Max products per outlet must be a positive number', HttpStatus.BAD_REQUEST);
            }
        }

        if (!adminId) {
            throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
        }

        // For now, just log the settings update
        // In a real implementation, you'd save to database
        // await AdminRepository.createAdminLog({
        //     action: 'UPDATE_PLATFORM_SETTINGS',
        //     details: settings,
        //     adminId
        // });

        return {
            message: 'Platform settings updated successfully',
            settings
        };
    }

    // === FINANCIAL REPORTS ===

    static async getReportsList() {
        // For now, return a simple list of available report types
        // TODO: Implement actual report history when Report model is added
        const reports = [
            {
                id: 'revenue-summary',
                type: 'revenue',
                period: 'monthly',
                totalAmount: 0,
                totalTransactions: 0,
                generatedAt: new Date().toISOString(),
                status: 'completed'
            },
            {
                id: 'business-performance',
                type: 'business',
                period: 'monthly',
                totalAmount: 0,
                totalTransactions: 0,
                generatedAt: new Date().toISOString(),
                status: 'completed'
            }
        ];

        return {
            reports,
            pagination: {
                page: 1,
                limit: 10,
                total: reports.length,
                totalPages: 1
            }
        };
    }

    static async getRevenueReport(options: {
        period?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const { period = 'monthly', startDate, endDate } = options;

        let start: Date | undefined;
        let end: Date | undefined;

        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        }

        const report = await AdminRepository.getRevenueReport({
            period,
            startDate: start,
            endDate: end
        });

        return report;
    }

    static async getBusinessPerformanceReport(options: {
        period?: string;
        startDate?: string;
        endDate?: string;
        businessId?: string;
    }) {
        const { period = 'monthly', startDate, endDate, businessId } = options;

        let start: Date | undefined;
        let end: Date | undefined;

        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        }

        const reports = await AdminRepository.getBusinessPerformanceReport({
            period,
            startDate: start,
            endDate: end,
            businessId
        });

        return reports;
    }

    static async generateReport(options: {
        type: string;
        period: string;
        startDate?: string;
        endDate?: string;
        businessId?: string;
    }) {
        const { type, period, startDate, endDate, businessId } = options;

        // Validate required fields
        if (!type || !period) {
            throw new AppError('Report type and period are required', HttpStatus.BAD_REQUEST);
        }

        // TODO: Implement actual report generation logic
        // For now, return success with a mock report ID
        const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return {
            message: 'Report generation started successfully',
            reportId,
            type,
            period,
            status: 'processing'
        };
    }
}