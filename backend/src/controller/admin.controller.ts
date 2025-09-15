import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/response';
import { HttpStatus } from '../constants/http-status';
import { asyncHandler } from '../middleware/error.middleware';
import { AppError } from '../errors/app-error';
import { db } from '../config/prisma';
import { UserRole, ServiceStatus } from '@prisma/client';

// === DASHBOARD OVERVIEW ===

export const getDashboardOverviewController = asyncHandler(async (req: Request, res: Response) => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get key metrics
    const [
        totalBusinesses,
        activeBusinesses,
        totalRevenue,
        todayRevenue,
        monthlyRevenue,
        pendingWithdrawals,
        totalTransactions,
        todayTransactions
    ] = await Promise.all([
        // Total businesses
        db.business.count(),

        // Active businesses (for now, count all since no status field)
        db.business.count(),

        // Total revenue (from completed orders)
        db.order.aggregate({
            where: { paymentStatus: 'SUCCESS' },
            _sum: { totalAmount: true }
        }),

        // Today's revenue
        db.order.aggregate({
            where: {
                paymentStatus: 'SUCCESS',
                createdAt: { gte: startOfDay }
            },
            _sum: { totalAmount: true }
        }),

        // Monthly revenue
        db.order.aggregate({
            where: {
                paymentStatus: 'SUCCESS',
                createdAt: { gte: startOfMonth }
            },
            _sum: { totalAmount: true }
        }),

        // Pending withdrawals
        db.withdrawal.count({ where: { status: 'PENDING' } }),

        // Total transactions
        db.order.count({ where: { paymentStatus: 'SUCCESS' } }),

        // Today's transactions
        db.order.count({
            where: {
                paymentStatus: 'SUCCESS',
                createdAt: { gte: startOfDay }
            }
        })
    ]);

    // Recent activities
    const recentOrders = await db.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            outlet: {
                select: {
                    business: { select: { name: true } }
                }
            },
            guestCustomer: { select: { name: true } }
        }
    });

    const recentWithdrawals = await db.withdrawal.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            business: { select: { name: true } }
        }
    });

    return ResponseUtil.success(res, {
        overview: {
            totalBusinesses,
            activeBusinesses,
            totalRevenue: totalRevenue._sum.totalAmount || 0,
            todayRevenue: todayRevenue._sum.totalAmount || 0,
            monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
            pendingWithdrawals,
            totalTransactions,
            todayTransactions
        },
        recentActivities: {
            orders: recentOrders,
            withdrawals: recentWithdrawals
        }
    }, HttpStatus.OK);
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

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (search) {
        where.OR = [
            { name: { contains: search as string, mode: 'insensitive' } },
            { owner: { name: { contains: search as string, mode: 'insensitive' } } },
            { owner: { email: { contains: search as string, mode: 'insensitive' } } }
        ];
    }

    const [businesses, total] = await Promise.all([
        db.business.findMany({
            where,
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                outlets: {
                    select: {
                        id: true,
                        name: true,
                        address: true
                    }
                },
                wallet: {
                    select: {
                        balance: true
                    }
                },
                _count: {
                    select: {
                        outlets: true
                    }
                }
            },
            orderBy: { [sortBy as string]: sortOrder },
            skip,
            take: limitNum
        }),
        db.business.count({ where })
    ]);

    return ResponseUtil.success(res, {
        businesses,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    }, HttpStatus.OK);
});

export const getBusinessDetailsController = asyncHandler(async (req: Request, res: Response) => {
    const { businessId } = req.params;

    // Validate businessId
    if (!businessId) {
        throw new AppError('Business ID is required', HttpStatus.BAD_REQUEST);
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(businessId)) {
        throw new AppError('Invalid business ID format', HttpStatus.BAD_REQUEST);
    }

    const business = await db.business.findUnique({
        where: { id: businessId },
        include: {
            owner: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    createdAt: true
                }
            },
            outlets: {
                include: {
                    _count: {
                        select: {
                            orders: true,
                            products: true
                        }
                    },
                    orders: {
                        take: 10,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            guestCustomer: { select: { name: true } }
                        }
                    }
                }
            },
            wallet: true,
            withdrawals: {
                take: 10,
                orderBy: { createdAt: 'desc' }
            },
            _count: {
                select: {
                    outlets: true
                }
            }
        }
    });

    if (!business) {
        throw new AppError('Business not found', HttpStatus.NOT_FOUND);
    }

    // Calculate business statistics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [monthlyRevenue, monthlyOrders] = await Promise.all([
        db.order.aggregate({
            where: {
                outlet: {
                    businessId
                },
                paymentStatus: 'SUCCESS',
                createdAt: { gte: thirtyDaysAgo }
            },
            _sum: { totalAmount: true }
        }),
        db.order.count({
            where: {
                outlet: {
                    businessId
                },
                paymentStatus: 'SUCCESS',
                createdAt: { gte: thirtyDaysAgo }
            }
        })
    ]);

    return ResponseUtil.success(res, {
        business,
        statistics: {
            monthlyRevenue: monthlyRevenue._sum?.totalAmount || 0,
            monthlyOrders,
            totalOrders: business.outlets.reduce((sum, outlet) => sum + (outlet._count?.orders || 0), 0),
            totalOutlets: business._count.outlets,
            totalProducts: business.outlets.reduce((sum, outlet) => sum + (outlet._count?.products || 0), 0),
            walletBalance: business.wallet?.balance || 0
        }
    }, HttpStatus.OK);
});

// === ANALYTICS & REPORTING ===

export const getRevenueAnalyticsController = asyncHandler(async (req: Request, res: Response) => {
    const { period = 'monthly', startDate, endDate } = req.query;

    // Validate period parameter
    const allowedPeriods = ['monthly', 'weekly', 'daily'];
    if (!allowedPeriods.includes(period as string)) {
        throw new AppError(`Invalid period. Must be one of: ${allowedPeriods.join(', ')}`, HttpStatus.BAD_REQUEST);
    }

    // Validate date parameters if provided
    if (startDate) {
        const start = new Date(startDate as string);
        if (isNaN(start.getTime())) {
            throw new AppError('Invalid startDate format. Use ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)', HttpStatus.BAD_REQUEST);
        }
    }

    if (endDate) {
        const end = new Date(endDate as string);
        if (isNaN(end.getTime())) {
            throw new AppError('Invalid endDate format. Use ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)', HttpStatus.BAD_REQUEST);
        }
    }

    // Validate date range if both dates are provided
    if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        if (start >= end) {
            throw new AppError('startDate must be before endDate', HttpStatus.BAD_REQUEST);
        }
    }

    const now = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(now.getMonth() - 12);

    let dateFilter: any = {};

    if (startDate && endDate) {
        dateFilter = {
            createdAt: {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string)
            }
        };
    } else {
        // Default to last 12 months
        dateFilter = {
            createdAt: { gte: twelveMonthsAgo }
        };
    }

    // Revenue by period - using Prisma aggregate instead of raw SQL
    const revenueData = await db.order.groupBy({
        by: ['createdAt'],
        where: {
            paymentStatus: 'SUCCESS',
            ...dateFilter
        },
        _sum: {
            totalAmount: true
        },
        _count: true,
        orderBy: {
            createdAt: 'asc'
        }
    });

    // Group by month manually
    const monthlyRevenue = revenueData.reduce((acc, item) => {
        const month = new Date(item.createdAt).toISOString().slice(0, 7); // YYYY-MM format
        if (!acc[month]) {
            acc[month] = { revenue: 0, transactions: 0 };
        }
        acc[month].revenue += item._sum.totalAmount || 0;
        acc[month].transactions += item._count;
        return acc;
    }, {} as Record<string, { revenue: number; transactions: number }>);

    const formattedRevenueData = Object.entries(monthlyRevenue).map(([period, data]) => ({
        period,
        revenue: data.revenue,
        transactions: data.transactions
    }));

    // Revenue by payment method
    const paymentMethodData = await db.transaction.groupBy({
        by: ['paymentMethod'],
        where: {
            status: 'SUCCESS',
            order: {
                ...dateFilter
            }
        },
        _sum: {
            amount: true
        },
        _count: true
    });

    // Top businesses by revenue
    const topBusinesses = await db.business.findMany({
        take: 10,
        include: {
            _count: {
                select: {
                    outlets: true
                }
            },
            outlets: {
                include: {
                    orders: {
                        where: {
                            paymentStatus: 'SUCCESS',
                            ...dateFilter
                        },
                        select: {
                            totalAmount: true
                        }
                    }
                }
            }
        }
    });

    // Calculate total revenue for each business
    const businessesWithRevenue = topBusinesses.map(business => {
        const totalRevenue = business.outlets.reduce((businessSum, outlet) => {
            return businessSum + outlet.orders.reduce((outletSum: number, order: any) => outletSum + order.totalAmount, 0);
        }, 0);
        const totalOrders = business.outlets.reduce((count, outlet) => count + outlet.orders.length, 0);

        return {
            id: business.id,
            name: business.name,
            totalRevenue,
            totalOrders
        };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    return ResponseUtil.success(res, {
        revenueByPeriod: formattedRevenueData,
        revenueByPaymentMethod: paymentMethodData,
        topBusinesses: businessesWithRevenue
    }, HttpStatus.OK);
});

export const getTransactionAnalyticsController = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    // Validate date parameters if provided
    if (startDate) {
        const start = new Date(startDate as string);
        if (isNaN(start.getTime())) {
            throw new AppError('Invalid startDate format. Use ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)', HttpStatus.BAD_REQUEST);
        }
    }

    if (endDate) {
        const end = new Date(endDate as string);
        if (isNaN(end.getTime())) {
            throw new AppError('Invalid endDate format. Use ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)', HttpStatus.BAD_REQUEST);
        }
    }

    // Validate date range if both dates are provided
    if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        if (start >= end) {
            throw new AppError('startDate must be before endDate', HttpStatus.BAD_REQUEST);
        }
    }

    const dateFilter = startDate && endDate ? {
        createdAt: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
        }
    } : {};

    // Transaction success rate
    const [totalTransactions, successfulTransactions, failedTransactions] = await Promise.all([
        db.order.count({ where: dateFilter }),
        db.order.count({ where: { paymentStatus: 'SUCCESS', ...dateFilter } }),
        db.order.count({ where: { paymentStatus: 'FAILED', ...dateFilter } })
    ]);

    // Transactions by status
    const transactionsByStatus = await db.order.groupBy({
        by: ['paymentStatus'],
        where: dateFilter,
        _count: true
    });

    // Transactions by hour (for today)
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const transactionsByHour = await db.$queryRaw`
        SELECT
            EXTRACT(hour from "createdAt") as hour,
            COUNT(*) as transactions
        FROM "Order"
        WHERE "createdAt" >= ${startOfToday}
        GROUP BY EXTRACT(hour from "createdAt")
        ORDER BY hour
    `;

    return ResponseUtil.success(res, {
        summary: {
            totalTransactions,
            successfulTransactions,
            failedTransactions,
            successRate: totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0
        },
        transactionsByStatus,
        transactionsByHour
    }, HttpStatus.OK);
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

    // Validate page parameter
    const pageNum = parseInt(page as string);
    if (isNaN(pageNum) || pageNum < 1) {
        throw new AppError('Page must be a positive integer', HttpStatus.BAD_REQUEST);
    }

    // Validate limit parameter
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new AppError('Limit must be a positive integer between 1 and 100', HttpStatus.BAD_REQUEST);
    }

    // Validate role parameter if provided
    const allowedRoles = ['ADMIN', 'BUSINESS_OWNER', 'CUSTOMER'];
    if (role && !allowedRoles.includes(role as string)) {
        throw new AppError(`Invalid role. Must be one of: ${allowedRoles.join(', ')}`, HttpStatus.BAD_REQUEST);
    }

    // Validate status parameter if provided
    const allowedStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'];
    if (status && !allowedStatuses.includes(status as string)) {
        throw new AppError(`Invalid status. Must be one of: ${allowedStatuses.join(', ')}`, HttpStatus.BAD_REQUEST);
    }

    // Validate search parameter if provided
    if (search && typeof search !== 'string') {
        throw new AppError('Search parameter must be a string', HttpStatus.BAD_REQUEST);
    }

    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
        where.OR = [
            { name: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } }
        ];
    }

    const [users, total] = await Promise.all([
        db.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                business: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum
        }),
        db.user.count({ where })
    ]);

    return ResponseUtil.success(res, {
        users,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    }, HttpStatus.OK);
});

export const updateUserStatusController = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { status, notes } = req.body;

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

    // Validate notes (optional but if provided, should be reasonable length)
    if (notes && typeof notes !== 'string') {
        throw new AppError('Notes must be a string', HttpStatus.BAD_REQUEST);
    }

    if (notes && notes.length > 500) {
        throw new AppError('Notes must be less than 500 characters', HttpStatus.BAD_REQUEST);
    }

    if (!req.user?.id) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    let user;
    try {
        user = await db.user.update({
            where: { id: userId },
            data: {
                status: status as ServiceStatus,
                updatedAt: new Date()
            },
            select: {
                id: true,
                name: true,
                email: true,
                status: true
            }
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new AppError('User not found', HttpStatus.NOT_FOUND);
        }
        throw error;
    }

    return ResponseUtil.success(res, {
        message: `User status updated to ${status}`,
        user
    }, HttpStatus.OK);
});

// === FINANCIAL MANAGEMENT ===

export const getFinancialReportsController = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, reportType = 'summary' } = req.query;

    // Validate reportType parameter
    const allowedReportTypes = ['summary', 'detailed'];
    if (!allowedReportTypes.includes(reportType as string)) {
        throw new AppError(`Invalid report type. Must be one of: ${allowedReportTypes.join(', ')}`, HttpStatus.BAD_REQUEST);
    }

    // Validate date parameters if provided
    if (startDate) {
        const start = new Date(startDate as string);
        if (isNaN(start.getTime())) {
            throw new AppError('Invalid startDate format. Use ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)', HttpStatus.BAD_REQUEST);
        }
    }

    if (endDate) {
        const end = new Date(endDate as string);
        if (isNaN(end.getTime())) {
            throw new AppError('Invalid endDate format. Use ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)', HttpStatus.BAD_REQUEST);
        }
    }

    // Validate date range if both dates are provided
    if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        if (start >= end) {
            throw new AppError('startDate must be before endDate', HttpStatus.BAD_REQUEST);
        }
    }

    const dateFilter = startDate && endDate ? {
        createdAt: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
        }
    } : {};

    if (reportType === 'summary') {
        // Platform revenue summary
        const [
            totalRevenue,
            appFees,
            midtransFees,
            withdrawalAmount,
            pendingWithdrawals
        ] = await Promise.all([
            // Total revenue from successful orders
            db.order.aggregate({
                where: { paymentStatus: 'SUCCESS', ...dateFilter },
                _sum: { totalAmount: true }
            }),

            // App fees (2% from each transaction)
            db.order.aggregate({
                where: { paymentStatus: 'SUCCESS', ...dateFilter },
                _sum: { appFee: true }
            }),

            // Midtrans fees
            db.order.aggregate({
                where: { paymentStatus: 'SUCCESS', ...dateFilter },
                _sum: { midtransFee: true }
            }),

            // Total withdrawal amount
            db.withdrawal.aggregate({
                where: { status: 'COMPLETED', ...dateFilter },
                _sum: { finalAmount: true }
            }),

            // Pending withdrawal amount
            db.withdrawal.aggregate({
                where: { status: 'PENDING' },
                _sum: { finalAmount: true }
            })
        ]);

        return ResponseUtil.success(res, {
            summary: {
                totalRevenue: totalRevenue._sum.totalAmount || 0,
                appFees: appFees._sum.appFee || 0,
                midtransFees: midtransFees._sum.midtransFee || 0,
                netRevenue: (totalRevenue._sum.totalAmount || 0) - (appFees._sum.appFee || 0) - (midtransFees._sum.midtransFee || 0),
                totalWithdrawals: withdrawalAmount._sum.finalAmount || 0,
                pendingWithdrawals: pendingWithdrawals._sum.finalAmount || 0
            }
        }, HttpStatus.OK);

    } else if (reportType === 'detailed') {
        // Detailed transaction report
        const transactions = await db.order.findMany({
            where: {
                paymentStatus: 'SUCCESS',
                ...dateFilter
            },
            include: {
                outlet: {
                    select: {
                        business: { select: { name: true } }
                    }
                },
                guestCustomer: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return ResponseUtil.success(res, {
            transactions,
            totalCount: transactions.length
        }, HttpStatus.OK);
    }

    throw new AppError('Invalid report type', HttpStatus.BAD_REQUEST);
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

    // Validate page parameter
    const pageNum = parseInt(page as string);
    if (isNaN(pageNum) || pageNum < 1) {
        throw new AppError('Page must be a positive integer', HttpStatus.BAD_REQUEST);
    }

    // Validate limit parameter
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new AppError('Limit must be a positive integer between 1 and 100', HttpStatus.BAD_REQUEST);
    }

    // Validate adminId if provided
    if (adminId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(adminId as string)) {
            throw new AppError('Invalid admin ID format', HttpStatus.BAD_REQUEST);
        }
    }

    // Validate date parameters if provided
    if (startDate) {
        const start = new Date(startDate as string);
        if (isNaN(start.getTime())) {
            throw new AppError('Invalid startDate format. Use ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)', HttpStatus.BAD_REQUEST);
        }
    }

    if (endDate) {
        const end = new Date(endDate as string);
        if (isNaN(end.getTime())) {
            throw new AppError('Invalid endDate format. Use ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)', HttpStatus.BAD_REQUEST);
        }
    }

    // Validate date range if both dates are provided
    if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        if (start >= end) {
            throw new AppError('startDate must be before endDate', HttpStatus.BAD_REQUEST);
        }
    }

    // Since AdminLog model doesn't exist, return empty results
    // This can be implemented later with a proper logging system
    return ResponseUtil.success(res, {
        logs: [],
        pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            totalPages: 0
        }
    }, HttpStatus.OK);
});

export const getSystemHealthController = asyncHandler(async (req: Request, res: Response) => {
    // Check database connection
    const dbHealth = await db.$queryRaw`SELECT 1 as health_check`;

    // Get system metrics
    const [
        totalUsers,
        totalBusinesses,
        totalOrders,
        pendingOrders,
        systemUptime
    ] = await Promise.all([
        db.user.count(),
        db.business.count(),
        db.order.count(),
        db.order.count({ where: { paymentStatus: 'PENDING' } }),
        // This would typically come from a system monitoring service
        Promise.resolve(Date.now())
    ]);

    return ResponseUtil.success(res, {
        health: {
            database: dbHealth ? 'healthy' : 'unhealthy',
            status: 'healthy'
        },
        metrics: {
            totalUsers,
            totalBusinesses,
            totalOrders,
            pendingOrders,
            systemUptime
        },
        timestamp: new Date().toISOString()
    }, HttpStatus.OK);
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

    // Validate page parameter
    const pageNum = parseInt(page as string);
    if (isNaN(pageNum) || pageNum < 1) {
        throw new AppError('Page must be a positive integer', HttpStatus.BAD_REQUEST);
    }

    // Validate limit parameter
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new AppError('Limit must be a positive integer between 1 and 100', HttpStatus.BAD_REQUEST);
    }

    // Validate status parameter if provided
    const allowedStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
    if (status && !allowedStatuses.includes(status as string)) {
        throw new AppError(`Invalid status. Must be one of: ${allowedStatuses.join(', ')}`, HttpStatus.BAD_REQUEST);
    }

    // Validate priority parameter if provided
    const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (priority && !allowedPriorities.includes(priority as string)) {
        throw new AppError(`Invalid priority. Must be one of: ${allowedPriorities.join(', ')}`, HttpStatus.BAD_REQUEST);
    }

    // Validate search parameter if provided
    if (search && typeof search !== 'string') {
        throw new AppError('Search parameter must be a string', HttpStatus.BAD_REQUEST);
    }

    const skip = (pageNum - 1) * limitNum;

    // For now, we'll use orders with issues as "support tickets"
    // In a real implementation, you'd have a separate support ticket table
    const where: any = {};
    if (status) where.orderStatus = status;
    if (search) {
        where.OR = [
            { id: { contains: search as string } },
            { guestCustomer: { name: { contains: search as string, mode: 'insensitive' } } },
            { business: { name: { contains: search as string, mode: 'insensitive' } } }
        ];
    }

    const [tickets, total] = await Promise.all([
        db.order.findMany({
            where,
            include: {
                outlet: {
                    select: {
                        business: { select: { name: true } }
                    }
                },
                guestCustomer: { select: { name: true, phone: true } },
                items: {
                    include: {
                        product: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum
        }),
        db.order.count({ where })
    ]);

    return ResponseUtil.success(res, {
        tickets,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
        }
    }, HttpStatus.OK);
});

export const updateTicketStatusController = asyncHandler(async (req: Request, res: Response) => {
    const { ticketId } = req.params;
    const { status, notes } = req.body;

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

    // Validate notes (optional but if provided, should be reasonable length)
    if (notes && typeof notes !== 'string') {
        throw new AppError('Notes must be a string', HttpStatus.BAD_REQUEST);
    }

    if (notes && notes.length > 500) {
        throw new AppError('Notes must be less than 500 characters', HttpStatus.BAD_REQUEST);
    }

    if (!req.user?.id) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    // Update order status as ticket resolution
    const order = await db.order.update({
        where: { id: ticketId },
        data: {
            orderStatus: status,
            updatedAt: new Date()
        },
        include: {
            outlet: {
                select: {
                    business: { select: { name: true } }
                }
            },
            guestCustomer: { select: { name: true } }
        }
    });

    return ResponseUtil.success(res, {
        message: `Ticket status updated to ${status}`,
        order
    }, HttpStatus.OK);
});

// === SETTINGS & CONFIGURATION ===

export const getPlatformSettingsController = asyncHandler(async (req: Request, res: Response) => {
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

    return ResponseUtil.success(res, settings, HttpStatus.OK);
});

export const updatePlatformSettingsController = asyncHandler(async (req: Request, res: Response) => {
    const { settings } = req.body;

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

    if (!req.user?.id) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    // For now, just log the settings update
    // In a real implementation, you'd save to database
    await db.adminLog.create({
        data: {
            action: 'UPDATE_PLATFORM_SETTINGS',
            details: settings,
            adminId: req.user.id
        }
    });

    return ResponseUtil.success(res, {
        message: 'Platform settings updated successfully',
        settings
    }, HttpStatus.OK);
});

// === FINANCIAL REPORTS ===

export const getReportsListController = asyncHandler(async (req: Request, res: Response) => {
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

    return ResponseUtil.success(res, {
        reports,
        pagination: {
            page: 1,
            limit: 10,
            total: reports.length,
            totalPages: 1
        }
    }, HttpStatus.OK);
});

export const getRevenueReportController = asyncHandler(async (req: Request, res: Response) => {
    const { period = 'monthly', startDate, endDate } = req.query;

    let dateFilter: any = {};
    const now = new Date();

    if (startDate && endDate) {
        dateFilter.createdAt = {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
        };
    } else {
        // Calculate date range based on period
        switch (period) {
            case 'daily':
                dateFilter.createdAt = {
                    gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                    lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
                };
                break;
            case 'weekly':
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);
                dateFilter.createdAt = {
                    gte: weekStart,
                    lt: weekEnd
                };
                break;
            case 'monthly':
                dateFilter.createdAt = {
                    gte: new Date(now.getFullYear(), now.getMonth(), 1),
                    lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
                };
                break;
            case 'quarterly':
                const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 1);
                dateFilter.createdAt = {
                    gte: quarterStart,
                    lt: quarterEnd
                };
                break;
            case 'yearly':
                dateFilter.createdAt = {
                    gte: new Date(now.getFullYear(), 0, 1),
                    lt: new Date(now.getFullYear() + 1, 0, 1)
                };
                break;
        }
    }

    // Calculate previous period for growth comparison
    const currentStart = dateFilter.createdAt.gte;
    const currentEnd = dateFilter.createdAt.lt;
    const periodLength = currentEnd.getTime() - currentStart.getTime();
    const previousStart = new Date(currentStart.getTime() - periodLength);
    const previousEnd = new Date(currentStart.getTime());

    const [
        currentPeriodData,
        previousPeriodData
    ] = await Promise.all([
        // Current period data
        db.order.aggregate({
            where: {
                paymentStatus: 'SUCCESS',
                ...dateFilter
            },
            _sum: { totalAmount: true },
            _count: true
        }),

        // Previous period data for growth calculation
        db.order.aggregate({
            where: {
                paymentStatus: 'SUCCESS',
                createdAt: {
                    gte: previousStart,
                    lt: previousEnd
                }
            },
            _sum: { totalAmount: true },
            _count: true
        })
    ]);

    const totalRevenue = currentPeriodData._sum.totalAmount || 0;
    const totalTransactions = currentPeriodData._count;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const previousRevenue = previousPeriodData._sum.totalAmount || 0;
    const growth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return ResponseUtil.success(res, {
        period,
        totalRevenue,
        totalTransactions,
        averageTransaction,
        growth: Math.round(growth * 100) / 100
    }, HttpStatus.OK);
});

export const getBusinessPerformanceReportController = asyncHandler(async (req: Request, res: Response) => {
    const { period = 'monthly', startDate, endDate, businessId } = req.query;

    let dateFilter: any = {};
    const now = new Date();

    if (startDate && endDate) {
        dateFilter.createdAt = {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
        };
    } else {
        // Default to current month
        dateFilter.createdAt = {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
            lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
        };
    }

    const businessWhere: any = {};
    if (businessId) {
        businessWhere.id = businessId as string;
    }

    const businesses = await db.business.findMany({
        where: businessWhere,
        include: {
            outlets: {
                include: {
                    orders: {
                        where: {
                            paymentStatus: 'SUCCESS',
                            ...dateFilter
                        },
                        select: {
                            totalAmount: true,
                            appFee: true
                        }
                    }
                }
            }
        }
    });

    const businessReports = businesses.map((business: any) => {
        // Flatten all orders from all outlets of this business
        const allOrders = business.outlets.flatMap((outlet: any) => outlet.orders);
        const totalOrders = allOrders.length;
        const totalRevenue = allOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);
        const totalCommission = allOrders.reduce((sum: number, order: any) => sum + (order.appFee || 0), 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return {
            businessId: business.id,
            businessName: business.name,
            totalRevenue,
            totalOrders,
            averageOrderValue,
            commission: totalCommission
        };
    });

    return ResponseUtil.success(res, businessReports, HttpStatus.OK);
});

export const generateReportController = asyncHandler(async (req: Request, res: Response) => {
    const { type, period, startDate, endDate, businessId } = req.body;

    // Validate required fields
    if (!type || !period) {
        throw new AppError('Report type and period are required', HttpStatus.BAD_REQUEST);
    }

    // TODO: Implement actual report generation logic
    // For now, return success with a mock report ID
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return ResponseUtil.success(res, {
        message: 'Report generation started successfully',
        reportId,
        type,
        period,
        status: 'processing'
    }, HttpStatus.CREATED);
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