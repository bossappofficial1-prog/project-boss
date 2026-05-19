import { db } from "../config/prisma";

export class AdminRepository {

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
        const [orders] = await Promise.all([
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
                            phone: true,
                            isVerified: true
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

    static async toggleBusinessSuspend(businessId: string, isSuspended: boolean) {
        return await db.business.update({
            where: { id: businessId },
            data: {
                subscriptionStatus: isSuspended ? 'SUSPENDED' : 'ACTIVE'
            }
        });
    }

    // === OUTLET MANAGEMENT ===

    static async getAllOutlets(options: {
        page: number;
        limit: number;
        search?: string;
        status?: string;
    }) {
        const { page, limit, search, status } = options;
        const skip = (page - 1) * limit;

        const where: any = {};
        
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { business: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        if (status === 'OPEN') {
            where.isOpen = true;
        } else if (status === 'CLOSED') {
            where.isOpen = false;
        }

        const [outlets, total] = await Promise.all([
            db.outlet.findMany({
                where,
                include: {
                    business: {
                        select: {
                            id: true,
                            name: true,
                            owner: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            products: true,
                            staff: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            db.outlet.count({ where })
        ]);

        return { outlets, total };
    }

    static async forceCloseOutlet(outletId: string, isClosed: boolean) {
        return await db.outlet.update({
            where: { id: outletId },
            data: {
                isOpen: !isClosed
            }
        });
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

    static async getRevenueInsights() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfPrevMonth = new Date(startOfMonth);
        endOfPrevMonth.setDate(endOfPrevMonth.getDate() - 1);

        const [
            monthOrderAggregate,
            prevMonthRevenueAggregate,
            lifetimeOrderAggregate,
            subscriptionInvoiceAggregate,
            activeSubscriptions,
            cancelledThisMonth,
            paymentMethodsRaw,
            planDistributionRaw,
            topBusinessesRaw
        ] = await Promise.all([
            db.order.aggregate({
                where: {
                    paymentStatus: 'SUCCESS',
                    createdAt: { gte: startOfMonth }
                },
                _sum: {
                    totalAmount: true,
                    appFee: true,
                    midtransFee: true
                },
                _avg: { totalAmount: true },
                _count: { _all: true }
            }),
            db.order.aggregate({
                where: {
                    paymentStatus: 'SUCCESS',
                    createdAt: {
                        gte: startOfPrevMonth,
                        lte: endOfPrevMonth
                    }
                },
                _sum: { totalAmount: true }
            }),
            db.order.aggregate({
                where: { paymentStatus: 'SUCCESS' },
                _sum: {
                    totalAmount: true,
                    appFee: true,
                    midtransFee: true
                }
            }),
            db.subscriptionInvoice.aggregate({
                where: {
                    status: 'SUCCESS',
                    createdAt: { gte: startOfMonth }
                },
                _sum: { amount: true }
            }),
            db.businessSubscription.count({ where: { status: 'ACTIVE' } }),
            db.businessSubscription.count({
                where: {
                    status: 'CANCELLED',
                    updatedAt: { gte: startOfMonth }
                }
            }),
            db.transaction.groupBy({
                by: ['paymentMethod'],
                where: { status: 'SUCCESS' },
                _sum: { amount: true },
                _count: { _all: true }
            }),
            db.business.groupBy({
                by: ['subscriptionPlan'],
                _count: { _all: true }
            }),
            db.$queryRaw<{
                businessId: string;
                businessName: string;
                totalRevenue: number;
                totalOrders: bigint;
            }[]>`
                SELECT b.id as "businessId",
                       b.name as "businessName",
                       SUM(o."totalAmount") as "totalRevenue",
                       COUNT(o.id) as "totalOrders"
                FROM "Order" o
                INNER JOIN "Outlet" ot ON o."outletId" = ot.id
                INNER JOIN "Business" b ON ot."businessId" = b.id
                WHERE o."paymentStatus" = 'SUCCESS'
                GROUP BY b.id, b.name
                ORDER BY SUM(o."totalAmount") DESC
                LIMIT 5;
            `
        ]);

        const totalRevenueMTD = Number(monthOrderAggregate._sum.totalAmount || 0);
        const appFeeMTD = Number(monthOrderAggregate._sum.appFee || 0);
        const midtransFeeMTD = Number(monthOrderAggregate._sum.midtransFee || 0);
        const netRevenueMTD = totalRevenueMTD - appFeeMTD - midtransFeeMTD;
        const totalTransactionsMTD = monthOrderAggregate._count?._all || 0;
        const averageOrderValue = Number(monthOrderAggregate._avg?.totalAmount || 0);
        const previousRevenue = Number(prevMonthRevenueAggregate._sum.totalAmount || 0);
        const revenueGrowth = previousRevenue > 0
            ? ((totalRevenueMTD - previousRevenue) / previousRevenue) * 100
            : totalRevenueMTD > 0 ? 100 : 0;
        const mrr = Number(subscriptionInvoiceAggregate._sum.amount || 0);
        const arr = mrr * 12;
        const churnRate = activeSubscriptions > 0
            ? (cancelledThisMonth / activeSubscriptions) * 100
            : 0;

        const paymentTotal = paymentMethodsRaw.reduce((sum, item) => sum + Number(item._sum.amount || 0), 0);
        const paymentMethods = paymentMethodsRaw.map(item => {
            const totalAmount = Number(item._sum.amount || 0);
            return {
                method: item.paymentMethod || 'UNSPECIFIED',
                totalAmount,
                transactionCount: item._count._all,
                percentage: paymentTotal > 0 ? (totalAmount / paymentTotal) * 100 : 0
            };
        });

        const planTotal = planDistributionRaw.reduce((sum, item) => sum + item._count._all, 0);
        const subscriptionPlans = planDistributionRaw.map(item => ({
            plan: item.subscriptionPlan,
            businesses: item._count._all,
            percentage: planTotal > 0 ? (item._count._all / planTotal) * 100 : 0
        }));

        const lifetimeGross = Number(lifetimeOrderAggregate._sum.totalAmount || 0);
        const lifetimeAppFee = Number(lifetimeOrderAggregate._sum.appFee || 0);
        const lifetimeMidtransFee = Number(lifetimeOrderAggregate._sum.midtransFee || 0);
        const lifetimeNet = lifetimeGross - lifetimeAppFee - lifetimeMidtransFee;

        const topBusinesses = topBusinessesRaw.map(row => ({
            businessId: row.businessId,
            businessName: row.businessName,
            totalRevenue: Number(row.totalRevenue || 0),
            totalOrders: Number(row.totalOrders || 0)
        }));

        return {
            summary: {
                windowStart: startOfMonth.toISOString(),
                windowEnd: now.toISOString(),
                totalRevenue: totalRevenueMTD,
                netRevenue: netRevenueMTD,
                totalTransactions: totalTransactionsMTD,
                averageOrderValue,
                revenueGrowth,
                mrr,
                arr,
                churnRate,
                activeSubscriptions
            },
            feeBreakdown: {
                grossRevenue: lifetimeGross,
                appFees: lifetimeAppFee,
                paymentFees: lifetimeMidtransFee,
                netRevenue: lifetimeNet
            },
            paymentMethods,
            subscriptionPlans,
            topBusinesses
        };
    }

    static async getSubscriptionIncomeOverview(options: { months: number }) {
        const months = Math.min(Math.max(options.months, 1), 24);
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfRange = new Date(startOfCurrentMonth);
        startOfRange.setMonth(startOfRange.getMonth() - (months - 1));
        const previousMonthStart = new Date(startOfCurrentMonth);
        previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
        const previousMonthEnd = new Date(startOfCurrentMonth);
        previousMonthEnd.setDate(previousMonthEnd.getDate() - 1);
        const renewalWindowEnd = new Date(now);
        renewalWindowEnd.setDate(renewalWindowEnd.getDate() + 30);
        const overdueThreshold = new Date(now);
        overdueThreshold.setDate(overdueThreshold.getDate() - 7);

        const [
            currentInvoiceAggregate,
            previousInvoiceAggregate,
            invoiceTrendRaw,
            planCounts,
            planRevenueRaw,
            invoiceStatusRaw,
            activeSubscriptions,
            expiringSoonCount,
            overdueAggregate,
            upcomingRenewalsRaw,
            recentInvoicesRaw
        ] = await Promise.all([
            db.subscriptionInvoice.aggregate({
                where: {
                    status: 'SUCCESS',
                    createdAt: { gte: startOfCurrentMonth }
                },
                _sum: { amount: true },
                _count: { _all: true }
            }),
            db.subscriptionInvoice.aggregate({
                where: {
                    status: 'SUCCESS',
                    createdAt: {
                        gte: previousMonthStart,
                        lte: previousMonthEnd
                    }
                },
                _sum: { amount: true }
            }),
            db.$queryRaw<{
                period: Date;
                revenue: number;
                invoices: bigint;
            }[]>`
                SELECT
                    DATE_TRUNC('month', "createdAt") as period,
                    SUM("amount") as revenue,
                    COUNT(*) as invoices
                FROM "SubscriptionInvoice"
                WHERE "status" = 'SUCCESS'
                    AND "createdAt" >= ${startOfRange}
                GROUP BY DATE_TRUNC('month', "createdAt")
                ORDER BY period ASC;
            `,
            db.business.groupBy({
                by: ['subscriptionPlan'],
                where: {
                    subscriptionStatus: {
                        in: ['ACTIVE', 'TRIAL', 'PAST_DUE']
                    }
                },
                _count: { _all: true }
            }),
            db.$queryRaw<{
                planCode: string | null;
                planName: string | null;
                revenue: number;
            }[]>`
                SELECT
                    COALESCE(sp.code, b."subscriptionPlan") as "planCode",
                    COALESCE(sp.name, b."subscriptionPlan") as "planName",
                    SUM(si."amount") as revenue
                FROM "SubscriptionInvoice" si
                INNER JOIN "BusinessSubscription" bs ON si."subscriptionId" = bs.id
                INNER JOIN "Business" b ON bs."businessId" = b.id
                LEFT JOIN "SubscriptionPlan" sp ON bs."planId" = sp.id
                WHERE si."status" = 'SUCCESS'
                    AND si."createdAt" >= ${startOfCurrentMonth}
                GROUP BY COALESCE(sp.code, b."subscriptionPlan"), COALESCE(sp.name, b."subscriptionPlan");
            `,
            db.subscriptionInvoice.groupBy({
                by: ['status'],
                _count: { _all: true },
                _sum: { amount: true }
            }),
            db.businessSubscription.count({ where: { status: 'ACTIVE' } }),
            db.businessSubscription.count({
                where: {
                    status: 'ACTIVE',
                    endDate: {
                        gte: now,
                        lte: renewalWindowEnd
                    }
                }
            }),
            db.subscriptionInvoice.aggregate({
                where: {
                    status: {
                        in: ['PENDING', 'PROOF_SUBMITTED', 'AWAITING_VERIFICATION']
                    },
                    createdAt: { lte: overdueThreshold }
                },
                _count: { _all: true },
                _sum: { amount: true }
            }),
            db.businessSubscription.findMany({
                where: {
                    status: 'ACTIVE',
                    endDate: {
                        gte: now,
                        lte: renewalWindowEnd
                    }
                },
                orderBy: { endDate: 'asc' },
                take: 6,
                include: {
                    business: { select: { id: true, name: true, subscriptionPlan: true } },
                    plan: { select: { name: true, code: true } }
                }
            }),
            db.subscriptionInvoice.findMany({
                orderBy: { createdAt: 'desc' },
                take: 8,
                include: {
                    business: { select: { id: true, name: true, subscriptionPlan: true } },
                    subscription: {
                        include: { plan: true }
                    }
                }
            })
        ]);

        const mrr = Number(currentInvoiceAggregate._sum.amount || 0);
        const invoicesThisMonth = currentInvoiceAggregate._count?._all || 0;
        const arr = mrr * 12;
        const previousMrr = Number(previousInvoiceAggregate._sum.amount || 0);
        const mrrGrowth = previousMrr > 0
            ? ((mrr - previousMrr) / previousMrr) * 100
            : mrr > 0 ? 100 : 0;
        const averageContractValue = invoicesThisMonth > 0 ? mrr / invoicesThisMonth : 0;

        const revenueTrend = invoiceTrendRaw.map(item => ({
            date: item.period instanceof Date ? item.period.toISOString() : String(item.period),
            revenue: Number(item.revenue || 0),
            invoices: Number(item.invoices || 0n)
        }));

        const totalActiveBusinesses = planCounts.reduce((sum, plan) => sum + plan._count._all, 0);
        const planRevenueMap = new Map<string, { revenue: number; name: string }>();
        planRevenueRaw.forEach(plan => {
            const key = plan.planCode || 'UNSPECIFIED';
            planRevenueMap.set(key, {
                revenue: Number(plan.revenue || 0),
                name: plan.planName || key
            });
        });

        const planDistribution = planCounts.map(plan => {
            const planKey = plan.subscriptionPlan || 'UNSPECIFIED';
            const revenueInfo = planRevenueMap.get(planKey);
            const businesses = plan._count._all;
            return {
                planCode: planKey,
                planName: revenueInfo?.name || planKey,
                businesses,
                percentage: totalActiveBusinesses > 0 ? (businesses / totalActiveBusinesses) * 100 : 0,
                mrrContribution: revenueInfo?.revenue || 0
            };
        });

        const invoiceStatus = invoiceStatusRaw.map(item => ({
            status: item.status,
            invoices: item._count._all,
            amount: Number(item._sum.amount || 0)
        }));

        const upcomingRenewals = upcomingRenewalsRaw.map(renewal => ({
            subscriptionId: renewal.id,
            businessId: renewal.businessId,
            businessName: renewal.business.name,
            planCode: renewal.plan?.code || renewal.business.subscriptionPlan,
            planName: renewal.plan?.name || renewal.business.subscriptionPlan,
            endsAt: renewal.endDate.toISOString(),
            daysRemaining: Math.max(0, Math.ceil((renewal.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        }));

        const recentInvoices = recentInvoicesRaw.map(invoice => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            businessId: invoice.businessId,
            businessName: invoice.business?.name ?? 'business name',
            amount: invoice.amount,
            status: invoice.status,
            issuedAt: invoice.createdAt.toISOString(),
            paidAt: invoice.paidAt ? invoice.paidAt.toISOString() : null,
            planName: invoice.subscription?.plan?.name || (invoice.business?.subscriptionPlan ?? 'plan')
        }));

        return {
            summary: {
                mrr,
                arr,
                mrrGrowth,
                activeSubscriptions,
                expiringSoon: expiringSoonCount,
                overdueInvoices: overdueAggregate._count?._all || 0,
                overdueAmount: Number(overdueAggregate._sum.amount || 0),
                averageContractValue
            },
            revenueTrend: {
                period: 'monthly',
                months,
                points: revenueTrend
            },
            planDistribution,
            invoiceStatus,
            upcomingRenewals,
            recentInvoices
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
                    createdAt: true,
                    updatedAt: true,
                    business: {
                        select: {
                            id: true,
                            name: true
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

            ]);

            return {
                totalRevenue: totalRevenue._sum.totalAmount || 0,
                appFees: appFees._sum.appFee || 0,
                midtransFees: midtransFees._sum.midtransFee || 0,
                netRevenue: (totalRevenue._sum.totalAmount || 0) - (appFees._sum.appFee || 0) - (midtransFees._sum.midtransFee || 0)
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
            activeConnections,
            dbHealthCheck
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

            // Active connections (mock data for now)
            Promise.resolve(0),

            // Checking actual db connection latency
            (async () => {
                const start = Date.now();
                try {
                    await db.$queryRaw`SELECT 1`;
                    return { status: 'connected', responseTime: Date.now() - start };
                } catch (e) {
                    return { status: 'disconnected', responseTime: 0 };
                }
            })()
        ]);

        const os = require('os');

        // Calculate system uptime
        const uptime = process.uptime ? Math.floor(process.uptime()) : 86400;

        // Calculate real memory
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        // Calculate CPU usage (simple snapshot)
        const cpus = os.cpus();
        let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
        for (const cpu of cpus) {
            user += cpu.times.user;
            nice += cpu.times.nice;
            sys += cpu.times.sys;
            idle += cpu.times.idle;
            irq += cpu.times.irq;
        }
        const totalCpuTime = user + nice + sys + idle + irq;
        const cpuUsage = totalCpuTime > 0 ? ((totalCpuTime - idle) / totalCpuTime) * 100 : 0;

        const systemMetrics = {
            status: dbHealthCheck.status === 'connected' ? 'healthy' : 'unhealthy' as 'healthy' | 'warning' | 'unhealthy' | 'unknown',
            uptime,
            memory: {
                used: Math.floor(usedMem / (1024 * 1024)),
                total: Math.floor(totalMem / (1024 * 1024)),
                percentage: Math.floor((usedMem / totalMem) * 100)
            },
            cpu: {
                usage: Math.floor(cpuUsage)
            },
            database: {
                status: dbHealthCheck.status as 'connected' | 'disconnected',
                responseTime: dbHealthCheck.responseTime
            },
            timestamp: new Date().toISOString()
        };

        return {
            health: systemMetrics,
            metrics: {
                totalUsers,
                totalBusinesses,
                totalOrders,
                todayOrders,
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

    static async getAllOrders(options: {
        page: number;
        limit: number;
        search?: string;
        status?: string;
        paymentStatus?: string;
    }) {
        const { page, limit, search, status, paymentStatus } = options;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { id: { contains: search } },
                { guestCustomer: { name: { contains: search, mode: 'insensitive' } } },
                { outlet: { business: { name: { contains: search, mode: 'insensitive' } } } },
                { outlet: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }

        if (status) where.orderStatus = status;
        if (paymentStatus) where.paymentStatus = paymentStatus;

        const [orders, total] = await Promise.all([
            db.order.findMany({
                where,
                include: {
                    outlet: {
                        select: {
                            id: true,
                            name: true,
                            business: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    guestCustomer: {
                        select: {
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                    handledByStaff: {
                        select: {
                            name: true,
                        },
                    },
                    items: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                    type: true,
                                },
                            },
                        },
                    },
                    transaction: {
                        select: {
                            id: true,
                            paymentMethod: true,
                            status: true,
                            isManual: true,
                            paymentProofUrl: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            db.order.count({ where }),
        ]);

        return { orders, total };
    }

    static async deleteBusiness(businessId: string) {
        const business = await db.business.findUnique({
            where: { id: businessId }
        });
        if (!business) return null;

        return await db.business.delete({
            where: { id: businessId }
        });
    }

    static async deleteOutlet(outletId: string) {
        const outlet = await db.outlet.findUnique({
            where: { id: outletId }
        });
        if (!outlet) return null;

        return await db.outlet.delete({
            where: { id: outletId }
        });
    }
}