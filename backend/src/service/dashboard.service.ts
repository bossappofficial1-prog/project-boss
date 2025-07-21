import { db } from "../config/prisma";
import { ProductType } from "@prisma/client";

export async function getDashboardSummaryService(businessId: string) {
    // Note: Currently, this gets all data. In a multi-tenant app,
    // you would filter these queries by businessId or outletId.
    // For now, we'll assume a single business context for simplicity.

    const totalProducts = await db.product.count({
        where: {
            type: ProductType.GOODS,
            // outlet: { businessId: businessId } // Example for multi-tenancy
        }
    });

    const totalServices = await db.product.count({
        where: {
            type: ProductType.SERVICE,
            // outlet: { businessId: businessId }
        }
    });

    const totalOrders = await db.order.count({
        // where: { outlet: { businessId: businessId } }
    });

    const totalRevenue = await db.order.aggregate({
        _sum: {
            totalAmount: true,
        },
        where: {
            paymentStatus: 'SUCCESS',
            // outlet: { businessId: businessId }
        },
    });

    return {
        totalProducts,
        totalServices,
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
    };
}

export async function getOrderStatsService(businessId: string, period: 'week' | 'month') {
    const now = new Date();
    let startDate;

    if (period === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7));
    } else { // month
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const orders = await db.order.findMany({
        where: {
            createdAt: {
                gte: startDate,
            },
            // outlet: { businessId: businessId }
        },
        orderBy: {
            createdAt: 'asc',
        },
    });

    // This is a simple aggregation. In a real app, you might group by day/week in the database query itself.
    const stats = orders.reduce((acc, order) => {
        const date = order.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
            acc[date] = { totalOrders: 0, totalRevenue: 0 };
        }
        acc[date].totalOrders += 1;
        acc[date].totalRevenue += order.totalAmount;
        return acc;
    }, {} as Record<string, { totalOrders: number; totalRevenue: number }>);

    return stats;
}