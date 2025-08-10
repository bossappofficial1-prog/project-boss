import { db } from "../config/prisma";
import { PaymentStatus, ProductType } from "@prisma/client";

export async function getDashboardSummaryService(outletId: string) {
    // All metrics are scoped to the selected outlet

    const [totalProducts, totalServices, totalOrders, totalRevenueAgg] = await Promise.all([
        db.product.count({ where: { outletId, type: ProductType.GOODS } }),
        db.product.count({ where: { outletId, type: ProductType.SERVICE } }),
        db.order.count({ where: { outletId } }),
        db.order.aggregate({
            _sum: { totalAmount: true },
            where: { outletId, paymentStatus: 'SUCCESS' }
        })
    ]);

    return {
        totalProducts,
        totalServices,
        totalOrders,
        totalRevenue: totalRevenueAgg._sum.totalAmount || 0,
    };
}

export async function getOrderStatsService(outletId: string, period: 'week' | 'month') {
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
            outletId
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
        if (order.paymentStatus === PaymentStatus.SUCCESS) {
            acc[date].totalRevenue += order.totalAmount;
        }
        return acc;
    }, {} as Record<string, { totalOrders: number; totalRevenue: number }>);

    return stats;
}