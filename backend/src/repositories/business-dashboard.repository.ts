import { db } from "../config/prisma";
import { PaymentStatus, ProductType } from "@prisma/client";

export class BusinessDashboardRepository {
    /**
     * Get the start date for a given period
     */
    private static getStartDate(period: "week" | "month" | "year"): Date {
        const now = new Date();
        switch (period) {
            case "week":
                return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            case "month":
                return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            case "year":
                return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        }
    }

    /**
     * Get all outlet IDs for a business
     */
    static async getOutletIds(businessId: string): Promise<string[]> {
        const outlets = await db.outlet.findMany({
            where: { businessId },
            select: { id: true },
        });
        return outlets.map((o) => o.id);
    }

    /**
     * Count outlets for a business
     */
    static async countOutlets(businessId: string): Promise<number> {
        return db.outlet.count({ where: { businessId } });
    }

    /**
     * Aggregate summary: total revenue, total orders across all outlets
     */
    static async getAggregateSummary(
        outletIds: string[],
        period: "week" | "month" | "year"
    ) {
        if (!outletIds.length) {
            return { totalRevenue: 0, totalOrders: 0 };
        }

        const startDate = this.getStartDate(period);

        const orders = await db.order.findMany({
            where: {
                outletId: { in: outletIds },
                paymentStatus: PaymentStatus.SUCCESS,
                createdAt: { gte: startDate },
            },
            select: { totalAmount: true },
        });

        const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalOrders = orders.length;

        return { totalRevenue, totalOrders };
    }

    /**
     * Count products and services across all outlets
     */
    static async countProductsAndServices(outletIds: string[]) {
        if (!outletIds.length) {
            return { products: 0, services: 0 };
        }

        const [products, services] = await Promise.all([
            db.product.count({
                where: { outletId: { in: outletIds }, type: ProductType.GOODS },
            }),
            db.product.count({
                where: { outletId: { in: outletIds }, type: ProductType.SERVICE },
            }),
        ]);

        return { products, services };
    }

    /**
     * Revenue series grouped by date
     */
    static async getRevenueSeries(
        outletIds: string[],
        period: "week" | "month" | "year"
    ) {
        if (!outletIds.length) return [];

        const startDate = this.getStartDate(period);

        const orders = await db.order.findMany({
            where: {
                outletId: { in: outletIds },
                paymentStatus: PaymentStatus.SUCCESS,
                createdAt: { gte: startDate },
            },
            select: { totalAmount: true, createdAt: true },
            orderBy: { createdAt: "asc" },
        });

        const map = new Map<string, { revenue: number; orders: number }>();
        for (const order of orders) {
            const date = order.createdAt.toISOString().split("T")[0];
            const prev = map.get(date) || { revenue: 0, orders: 0 };
            map.set(date, {
                revenue: prev.revenue + order.totalAmount,
                orders: prev.orders + 1,
            });
        }

        return Array.from(map.entries())
            .map(([date, val]) => ({ date, revenue: val.revenue, orders: val.orders }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    /**
     * Payment breakdown: online vs manual
     */
    static async getPaymentBreakdown(
        outletIds: string[],
        period: "week" | "month" | "year"
    ) {
        if (!outletIds.length) return { online: 0, manual: 0 };

        const startDate = this.getStartDate(period);

        const transactions = await db.transaction.findMany({
            where: {
                order: {
                    outletId: { in: outletIds },
                    createdAt: { gte: startDate },
                },
                status: PaymentStatus.SUCCESS,
            },
            select: { isManual: true },
        });

        let online = 0;
        let manual = 0;
        for (const t of transactions) {
            if (t.isManual) manual++;
            else online++;
        }

        return { online, manual };
    }

    /**
     * Subscription info for a business
     */
    static async getSubscriptionInfo(businessId: string) {
        const biz = await db.business.findUnique({
            where: { id: businessId },
            select: {
                subscriptionStatus: true,
                subscriptionPlan: true,
                subscriptionEndDate: true,
            },
        });

        if (!biz) return null;

        const endsAt = biz.subscriptionEndDate
            ? biz.subscriptionEndDate.toISOString()
            : null;

        let daysLeft: number | null = null;
        if (biz.subscriptionEndDate) {
            daysLeft = Math.max(
                0,
                Math.ceil(
                    (biz.subscriptionEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                )
            );
        }

        return {
            status: biz.subscriptionStatus,
            plan: biz.subscriptionPlan,
            endsAt,
            daysLeft,
        };
    }

    /**
     * Outlet performance: revenue, orders, products, services per outlet
     */
    static async getOutletPerformance(
        businessId: string,
        period: "week" | "month" | "year",
        top: number
    ) {
        const startDate = this.getStartDate(period);

        const outlets = await db.outlet.findMany({
            where: { businessId },
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        products: true,
                    },
                },
            },
        });

        if (!outlets.length) return [];

        const result = await Promise.all(
            outlets.map(async (outlet) => {
                const [successOrders, products, services] = await Promise.all([
                    db.order.findMany({
                        where: {
                            outletId: outlet.id,
                            paymentStatus: PaymentStatus.SUCCESS,
                            createdAt: { gte: startDate },
                        },
                        select: { totalAmount: true },
                    }),
                    db.product.count({
                        where: { outletId: outlet.id, type: ProductType.GOODS },
                    }),
                    db.product.count({
                        where: { outletId: outlet.id, type: ProductType.SERVICE },
                    }),
                ]);

                const revenue = successOrders.reduce((s, o) => s + o.totalAmount, 0);
                const orders = successOrders.length;

                return {
                    id: outlet.id,
                    name: outlet.name,
                    revenue,
                    orders,
                    products,
                    services,
                };
            })
        );

        return result.sort((a, b) => b.revenue - a.revenue).slice(0, top);
    }

    /**
     * Recent orders across all outlets of a business
     */
    static async getRecentOrders(outletIds: string[], limit: number) {
        if (!outletIds.length) return [];

        const orders = await db.order.findMany({
            where: { outletId: { in: outletIds } },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: {
                id: true,
                outletId: true,
                totalAmount: true,
                createdAt: true,
                paymentStatus: true,
                orderStatus: true,
                outlet: { select: { name: true } },
                guestCustomer: { select: { name: true } },
            },
        });

        return orders.map((o) => ({
            id: o.id,
            outletId: o.outletId,
            outletName: o.outlet.name,
            amount: o.totalAmount,
            createdAt: o.createdAt.toISOString(),
            paymentStatus: o.paymentStatus,
            orderStatus: o.orderStatus,
            customerName: o.guestCustomer?.name || "Guest",
        }));
    }
}
