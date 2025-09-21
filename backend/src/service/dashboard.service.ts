import { db } from "../config/prisma";
import { PaymentStatus, ProductType } from "@prisma/client";

export async function getDashboardSummaryService(outletId: string) {
    // All metrics are scoped to the selected outlet

    const [totalProducts, totalServices, totalOrders, revenueData] = await Promise.all([
        db.product.count({ where: { outletId, type: ProductType.GOODS } }),
        db.product.count({ where: { outletId, type: ProductType.SERVICE } }),
        db.order.count({ where: { outletId } }),
        db.order.findMany({
            where: { outletId, paymentStatus: 'SUCCESS' },
            select: { totalAmount: true, appFee: true, midtransFee: true, chargedTo: true }
        })
    ]);

    // Calculate net revenue (subtract fees if charged to customer)
    const totalRevenue = revenueData.reduce((sum, order) => {
        const grossAmount = order.totalAmount;
        const fees = order.chargedTo === 'CUSTOMER' ? (order.appFee + order.midtransFee) : 0;
        return sum + (grossAmount - fees);
    }, 0);

    return {
        totalProducts,
        totalServices,
        totalOrders,
        totalRevenue,
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
        select: {
            id: true,
            createdAt: true,
            paymentStatus: true,
            totalAmount: true,
            appFee: true,
            midtransFee: true,
            chargedTo: true
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
            const grossAmount = order.totalAmount;
            const fees = order.chargedTo === 'CUSTOMER' ? (order.appFee + order.midtransFee) : 0;
            acc[date].totalRevenue += (grossAmount - fees);
        }
        return acc;
    }, {} as Record<string, { totalOrders: number; totalRevenue: number }>);

    return stats;
}