import { db } from "../config/prisma";

export class AdminRepository {
    // === DASHBOARD OVERVIEW ===

    static async getDashboardMetrics() {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Calculate previous month dates
        const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of previous month

        const [
            totalBusinesses,
            totalRevenue,
            todayRevenue,
            monthlyRevenue,
            previousMonthRevenue,
            pendingWithdrawals,
            totalTransactions,
            todayTransactions,
            // User counts
            totalUsers,
            currentMonthUsers,
            previousMonthUsers
        ] = await Promise.all([
            // Total businesses
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

            // Previous month revenue
            db.order.aggregate({
                where: {
                    paymentStatus: 'SUCCESS',
                    createdAt: {
                        gte: previousMonth,
                        lte: previousMonthEnd
                    }
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
            }),

            // Total users
            db.user.count(),

            // Current month users
            db.user.count({
                where: { createdAt: { gte: startOfMonth } }
            }),

            // Previous month users
            db.user.count({
                where: {
                    createdAt: {
                        gte: previousMonth,
                        lte: previousMonthEnd
                    }
                }
            })
        ]);

        // Calculate change percentages
        const currentRevenue = monthlyRevenue._sum.totalAmount || 0;
        const previousRevenue = previousMonthRevenue._sum.totalAmount || 0;
        const revenueChange = previousRevenue > 0
            ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
            : currentRevenue > 0 ? 100 : 0;

        const usersChange = previousMonthUsers > 0
            ? ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100
            : currentMonthUsers > 0 ? 100 : 0;

        // For businesses, we'll compare with previous month count
        const previousMonthBusinesses = await db.business.count({
            where: {
                createdAt: {
                    gte: previousMonth,
                    lte: previousMonthEnd
                }
            }
        });

        const businessesChange = previousMonthBusinesses > 0
            ? ((totalBusinesses - previousMonthBusinesses) / previousMonthBusinesses) * 100
            : totalBusinesses > 0 ? 100 : 0;

        return {
            totalUsers,
            totalBusinesses,
            totalRevenue: totalRevenue._sum.totalAmount || 0,
            todayRevenue: todayRevenue._sum.totalAmount || 0,
            monthlyRevenue: currentRevenue,
            pendingWithdrawals,
            totalTransactions,
            todayTransactions,
            // Change percentages
            usersChange: Math.round(usersChange * 100) / 100, // Round to 2 decimal places
            businessesChange: Math.round(businessesChange * 100) / 100,
            revenueChange: Math.round(revenueChange * 100) / 100
        };
    }

    static async getRecentActivities(limit: number = 10) {
        const result = await this.getAllActivities({ limit, page: 1 });
        return result.activities;
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

        const skip = (page - 1) * limit;

        // For now, we'll combine orders and withdrawals as activities
        // In a real implementation, you might have a dedicated activities table
        const [orders, withdrawals] = await Promise.all([
            db.order.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                where: {
                    ...(search && {
                        OR: [
                            { id: { contains: search } },
                            { guestCustomer: { name: { contains: search } } },
                            { outlet: { business: { name: { contains: search } } } }
                        ]
                    }),
                    ...(status && { orderStatus: status as any }),
                    ...(type && type === 'order_completed' && { orderStatus: 'COMPLETED' })
                },
                include: {
                    outlet: {
                        select: {
                            business: { select: { name: true } }
                        }
                    },
                    guestCustomer: { select: { name: true } }
                }
            }),
            db.withdrawal.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                where: {
                    ...(search && {
                        OR: [
                            { id: { contains: search } },
                            { business: { name: { contains: search } } }
                        ]
                    }),
                    ...(status && {
                        status: status === 'success' ? 'COMPLETED' as const :
                            status === 'warning' ? 'PENDING' as const :
                                status === 'error' ? 'REJECTED' as const :
                                    status as any
                    }),
                    ...(type && type === 'withdrawal_request' && { status: 'PENDING' as const })
                },
                include: {
                    business: { select: { name: true } }
                }
            })
        ]);

        // Convert to unified activity format
        const activities = [
            ...orders.map(order => ({
                id: order.id,
                type: 'order_completed' as const,
                description: `Order #${order.id} completed successfully`,
                timestamp: order.createdAt.toISOString(),
                status: 'success' as const
            })),
            ...withdrawals.map(withdrawal => ({
                id: withdrawal.id,
                type: 'withdrawal_request' as const,
                description: `Withdrawal request for ${withdrawal.business.name}`,
                timestamp: withdrawal.createdAt.toISOString(),
                status: withdrawal.status === 'COMPLETED' ? 'success' as const :
                    withdrawal.status === 'PENDING' ? 'warning' as const : 'error' as const
            }))
        ];

        // Sort by timestamp (most recent first)
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Apply pagination to combined results
        const paginatedActivities = activities.slice(0, limit);

        return {
            activities: paginatedActivities,
            total: activities.length,
            page,
            totalPages: Math.ceil(activities.length / limit)
        };
    }

    // === BUSINESS MANAGEMENT ===

    static async getAllBusinesses(options: {
        page: number;
        limit: number;
        status?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
    }) {
        const { page, limit, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = options;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { owner: { name: { contains: search, mode: 'insensitive' } } },
                { owner: { email: { contains: search, mode: 'insensitive' } } }
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
                            address: true,
                            _count: {
                                select: {
                                    orders: true
                                }
                            }
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
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit
            }),
            db.business.count({ where })
        ]);

        return { businesses, total };
    }

    static async getBusinessDetails(businessId: string) {
        return await db.business.findUnique({
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
    }

    static async getBusinessStatistics(businessId: string) {
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

        return {
            monthlyRevenue: monthlyRevenue._sum?.totalAmount || 0,
            monthlyOrders
        };
    }

    // === ANALYTICS & REPORTING ===

    static async getRevenueAnalyticsReport(options: {
        period?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const { startDate, endDate } = options;

        const now = new Date();
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(now.getMonth() - 12);

        let dateFilter: any = {};

        if (startDate && endDate) {
            dateFilter = {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            };
        } else {
            dateFilter = {
                createdAt: { gte: twelveMonthsAgo }
            };
        }

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

        const monthlyRevenue = revenueData.reduce((acc, item) => {
            const month = new Date(item.createdAt).toISOString().slice(0, 7);
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

        return {
            revenueByPeriod: formattedRevenueData,
            revenueByPaymentMethod: paymentMethodData,
            topBusinesses: businessesWithRevenue
        };
    }

    static async getTransactionAnalytics(options: {
        startDate?: Date;
        endDate?: Date;
    }) {
        const { startDate, endDate } = options;

        const dateFilter = startDate && endDate ? {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        } : {};

        const [totalTransactions, successfulTransactions, failedTransactions] = await Promise.all([
            db.order.count({ where: dateFilter }),
            db.order.count({ where: { paymentStatus: 'SUCCESS', ...dateFilter } }),
            db.order.count({ where: { paymentStatus: 'FAILED', ...dateFilter } })
        ]);

        const transactionsByStatus = await db.order.groupBy({
            by: ['paymentStatus'],
            where: dateFilter,
            _count: true
        });

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

        return {
            totalTransactions,
            successfulTransactions,
            failedTransactions,
            transactionsByStatus,
            transactionsByHour
        };
    }

    // === REVENUE ANALYTICS FOR CHART ===

    static async getRevenueAnalytics(options: {
        period: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const { period, startDate, endDate } = options;
        const now = new Date();

        let dateFilter: any = {};
        let groupByFormat: string;
        let periods: string[] = [];

        // Set up date filtering and grouping based on period
        if (period === 'daily') {
            // Last 30 days
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(now.getDate() - 30);
            dateFilter = {
                createdAt: { gte: thirtyDaysAgo }
            };
            groupByFormat = 'YYYY-MM-DD';
        } else if (period === 'weekly') {
            // Last 12 weeks
            const twelveWeeksAgo = new Date(now);
            twelveWeeksAgo.setDate(now.getDate() - 84);
            dateFilter = {
                createdAt: { gte: twelveWeeksAgo }
            };
            groupByFormat = 'YYYY-MM-DD'; // We'll group by week start date
        } else {
            // Monthly (default) - Last 12 months
            const twelveMonthsAgo = new Date(now);
            twelveMonthsAgo.setMonth(now.getMonth() - 12);
            dateFilter = {
                createdAt: { gte: twelveMonthsAgo }
            };
            groupByFormat = 'YYYY-MM';
        }

        // Override with custom date range if provided
        if (startDate && endDate) {
            dateFilter = {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            };
        }

        // Get revenue data grouped by the appropriate period
        let revenueData: Array<{
            period: string;
            revenue: number;
            transactions: number;
        }>;

        if (period === 'daily') {
            if (dateFilter.createdAt?.lte) {
                revenueData = await db.$queryRaw`
                    SELECT
                        DATE("createdAt") as period,
                        SUM("totalAmount") as revenue,
                        COUNT(*) as transactions
                    FROM "Order"
                    WHERE "paymentStatus" = 'SUCCESS'
                        AND "createdAt" >= ${dateFilter.createdAt.gte || new Date(0)}
                        AND "createdAt" <= ${dateFilter.createdAt.lte}
                    GROUP BY DATE("createdAt")
                    ORDER BY period ASC
                `;
            } else {
                revenueData = await db.$queryRaw`
                    SELECT
                        DATE("createdAt") as period,
                        SUM("totalAmount") as revenue,
                        COUNT(*) as transactions
                    FROM "Order"
                    WHERE "paymentStatus" = 'SUCCESS'
                        AND "createdAt" >= ${dateFilter.createdAt?.gte || new Date(0)}
                    GROUP BY DATE("createdAt")
                    ORDER BY period ASC
                `;
            }
        } else if (period === 'weekly') {
            if (dateFilter.createdAt?.lte) {
                revenueData = await db.$queryRaw`
                    SELECT
                        DATE("createdAt" - INTERVAL '1 day' * EXTRACT(dow FROM "createdAt")) as period,
                        SUM("totalAmount") as revenue,
                        COUNT(*) as transactions
                    FROM "Order"
                    WHERE "paymentStatus" = 'SUCCESS'
                        AND "createdAt" >= ${dateFilter.createdAt.gte || new Date(0)}
                        AND "createdAt" <= ${dateFilter.createdAt.lte}
                    GROUP BY DATE("createdAt" - INTERVAL '1 day' * EXTRACT(dow FROM "createdAt"))
                    ORDER BY period ASC
                `;
            } else {
                revenueData = await db.$queryRaw`
                    SELECT
                        DATE("createdAt" - INTERVAL '1 day' * EXTRACT(dow FROM "createdAt")) as period,
                        SUM("totalAmount") as revenue,
                        COUNT(*) as transactions
                    FROM "Order"
                    WHERE "paymentStatus" = 'SUCCESS'
                        AND "createdAt" >= ${dateFilter.createdAt?.gte || new Date(0)}
                    GROUP BY DATE("createdAt" - INTERVAL '1 day' * EXTRACT(dow FROM "createdAt"))
                    ORDER BY period ASC
                `;
            }
        } else {
            if (dateFilter.createdAt?.lte) {
                revenueData = await db.$queryRaw`
                    SELECT
                        DATE_TRUNC('month', "createdAt") as period,
                        SUM("totalAmount") as revenue,
                        COUNT(*) as transactions
                    FROM "Order"
                    WHERE "paymentStatus" = 'SUCCESS'
                        AND "createdAt" >= ${dateFilter.createdAt.gte || new Date(0)}
                        AND "createdAt" <= ${dateFilter.createdAt.lte}
                    GROUP BY DATE_TRUNC('month', "createdAt")
                    ORDER BY period ASC
                `;
            } else {
                revenueData = await db.$queryRaw`
                    SELECT
                        DATE_TRUNC('month', "createdAt") as period,
                        SUM("totalAmount") as revenue,
                        COUNT(*) as transactions
                    FROM "Order"
                    WHERE "paymentStatus" = 'SUCCESS'
                        AND "createdAt" >= ${dateFilter.createdAt?.gte || new Date(0)}
                    GROUP BY DATE_TRUNC('month', "createdAt")
                    ORDER BY period ASC
                `;
            }
        }        // Format the data for the chart
        const chartData = revenueData.map(item => ({
            date: item.period,
            revenue: Number(item.revenue) || 0,
            transactions: Number(item.transactions) || 0,
            period: period
        }));

        // Calculate summary statistics
        const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
        const totalTransactions = chartData.reduce((sum, item) => sum + item.transactions, 0);
        const averageRevenue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        return {
            chartData,
            summary: {
                totalRevenue,
                totalTransactions,
                averageRevenue,
                period
            }
        };
    }

    // === USER MANAGEMENT ===


    static async getAllUsers(options: {
        page: number;
        limit: number;
        role?: string;
        search?: string;
        status?: string;
    }) {
        const { page, limit, role, search, status } = options;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (role) where.role = role;
        if (status && status !== "all") where.status = status;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
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
                take: limit
            }),
            db.user.count({ where })
        ]);

        return { users, total };
    }

    static async updateUserStatus(userId: string, status: string) {
        return await db.user.update({
            where: { id: userId },
            data: {
                // Note: User model doesn't have status field in current schema
                // This will need to be updated when status field is added
                updatedAt: new Date()
            },
            select: {
                id: true,
                name: true,
                email: true,
                // status: true  // Commented out since field doesn't exist
            }
        });
    }

    // === FINANCIAL MANAGEMENT ===

    static async getFinancialReports(options: {
        startDate?: Date;
        endDate?: Date;
        reportType: string;
    }) {
        const { startDate, endDate, reportType } = options;

        const dateFilter = startDate && endDate ? {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        } : {};

        if (reportType === 'summary') {
            const [
                totalRevenue,
                appFees,
                midtransFees,
                withdrawalAmount,
                pendingWithdrawals
            ] = await Promise.all([
                db.order.aggregate({
                    where: { paymentStatus: 'SUCCESS', ...dateFilter },
                    _sum: { totalAmount: true }
                }),
                db.order.aggregate({
                    where: { paymentStatus: 'SUCCESS', ...dateFilter },
                    _sum: { appFee: true }
                }),
                db.order.aggregate({
                    where: { paymentStatus: 'SUCCESS', ...dateFilter },
                    _sum: { midtransFee: true }
                }),
                db.withdrawal.aggregate({
                    where: { status: 'COMPLETED', ...dateFilter },
                    _sum: { finalAmount: true }
                }),
                db.withdrawal.aggregate({
                    where: { status: 'PENDING' },
                    _sum: { finalAmount: true }
                })
            ]);

            return {
                totalRevenue: totalRevenue._sum.totalAmount || 0,
                appFees: appFees._sum.appFee || 0,
                midtransFees: midtransFees._sum.midtransFee || 0,
                netRevenue: (totalRevenue._sum.totalAmount || 0) - (appFees._sum.appFee || 0) - (midtransFees._sum.midtransFee || 0),
                totalWithdrawals: withdrawalAmount._sum.finalAmount || 0,
                pendingWithdrawals: pendingWithdrawals._sum.finalAmount || 0
            };
        } else if (reportType === 'detailed') {
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

            return { transactions, totalCount: transactions.length };
        }

        return null;
    }

    // === SYSTEM MANAGEMENT ===

    static async getSystemHealth() {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Get system metrics
        const [
            totalUsers,
            totalBusinesses,
            totalOrders,
            todayOrders,
            pendingWithdrawals,
            activeConnections
        ] = await Promise.all([
            // Total users
            db.user.count(),

            // Total businesses
            db.business.count(),

            // Total orders
            db.order.count(),

            // Today's orders
            db.order.count({
                where: {
                    createdAt: { gte: startOfDay }
                }
            }),

            // Pending withdrawals
            db.withdrawal.count({
                where: { status: 'PENDING' }
            }),

            // Active connections (mock data for now)
            Promise.resolve(0)
        ]);

        // Calculate system uptime (mock data - in production you'd get this from process.uptime())
        const uptime = process.uptime ? Math.floor(process.uptime()) : 86400; // Default to 1 day

        // Mock system metrics (in production you'd use system monitoring libraries)
        const systemMetrics = {
            status: 'healthy' as 'healthy' | 'warning' | 'unhealthy' | 'unknown',
            uptime,
            memory: {
                used: Math.floor(Math.random() * 1024) + 512, // Mock: 512-1536 MB
                total: 2048, // Mock: 2GB total
                percentage: Math.floor(Math.random() * 30) + 40 // Mock: 40-70%
            },
            cpu: {
                usage: Math.floor(Math.random() * 20) + 10 // Mock: 10-30%
            },
            database: {
                status: 'connected' as 'connected' | 'disconnected',
                responseTime: Math.floor(Math.random() * 50) + 10 // Mock: 10-60ms
            }
        };

        return {
            health: systemMetrics,
            metrics: {
                totalUsers,
                totalBusinesses,
                totalOrders,
                todayOrders,
                pendingWithdrawals,
                activeConnections
            }
        };
    }

    // === SUPPORT & DISPUTE MANAGEMENT ===

    static async getSupportTickets(options: {
        page: number;
        limit: number;
        status?: string;
        search?: string;
    }) {
        const { page, limit, status, search } = options;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.orderStatus = status;
        if (search) {
            where.OR = [
                { id: { contains: search } },
                { guestCustomer: { name: { contains: search, mode: 'insensitive' } } },
                { business: { name: { contains: search, mode: 'insensitive' } } }
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
                take: limit
            }),
            db.order.count({ where })
        ]);

        return { tickets, total };
    }

    static async updateTicketStatus(ticketId: string, status: string) {
        // Map the status to valid OrderStatus enum values
        const statusMapping: { [key: string]: string } = {
            'PENDING': 'AWAITING_PAYMENT',
            'PROCESSING': 'PROCESSING',
            'COMPLETED': 'COMPLETED',
            'CANCELLED': 'CANCELLED'
        };

        const mappedStatus = statusMapping[status] || status;

        return await db.order.update({
            where: { id: ticketId },
            data: {
                orderStatus: mappedStatus as any,
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
    }

    // === FINANCIAL REPORTS ===

    static async getRevenueReport(options: {
        period?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const { period = 'monthly', startDate, endDate } = options;

        let dateFilter: any = {};
        const now = new Date();

        if (startDate && endDate) {
            dateFilter.createdAt = {
                gte: startDate,
                lte: endDate
            };
        } else {
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

        const currentStart = dateFilter.createdAt.gte;
        const currentEnd = dateFilter.createdAt.lt;
        const periodLength = currentEnd.getTime() - currentStart.getTime();
        const previousStart = new Date(currentStart.getTime() - periodLength);
        const previousEnd = new Date(currentStart.getTime());

        const [
            currentPeriodData,
            previousPeriodData
        ] = await Promise.all([
            db.order.aggregate({
                where: {
                    paymentStatus: 'SUCCESS',
                    ...dateFilter
                },
                _sum: { totalAmount: true },
                _count: true
            }),
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

        return {
            period,
            totalRevenue,
            totalTransactions,
            averageTransaction,
            growth: Math.round(growth * 100) / 100
        };
    }

    static async getBusinessPerformanceReport(options: {
        period?: string;
        startDate?: Date;
        endDate?: Date;
        businessId?: string;
    }) {
        const { startDate, endDate, businessId } = options;

        let dateFilter: any = {};
        const now = new Date();

        if (startDate && endDate) {
            dateFilter.createdAt = {
                gte: startDate,
                lte: endDate
            };
        } else {
            dateFilter.createdAt = {
                gte: new Date(now.getFullYear(), now.getMonth(), 1),
                lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
            };
        }

        const businessWhere: any = {};
        if (businessId) {
            businessWhere.id = businessId;
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

        return businessReports;
    }

    static async createAdminLog(data: {
        action: string;
        details: any;
        adminId: string;
    }) {
        return await db.adminLog.create({
            data
        });
    }
}