import { db } from "../config/prisma";
import { OrderStatus } from "@prisma/client";

const goodsOrderInclude = {
    items: { include: { product: true } },
    guestCustomer: true,
    transaction: {
        select: {
            id: true,
            status: true,
            paymentMethod: true,
            isManual: true,
            paymentProofUrl: true,
            createdAt: true,
        },
    },
} as const;

export class OrdersV2Repository {
    static async getActiveOrdersByOutlet(outletId: string) {
        return db.order.findMany({
            where: {
                outletId,
                orderStatus: {
                    in: [
                        OrderStatus.AWAITING_PAYMENT,
                        OrderStatus.PROCESSING,
                        OrderStatus.CONFIRMED,
                        OrderStatus.READY,
                    ],
                },
                items: { some: { product: { type: "GOODS" } } },
            },
            include: goodsOrderInclude,
            orderBy: { createdAt: "desc" },
        });
    }

    static async getCompletedTodayByOutlet(outletId: string) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        return db.order.findMany({
            where: {
                outletId,
                orderStatus: OrderStatus.COMPLETED,
                items: { some: { product: { type: "GOODS" } } },
                updatedAt: { gte: startOfDay },
            },
            include: goodsOrderInclude,
            orderBy: { updatedAt: "desc" },
            take: 50,
        });
    }

    static async getTodayStats(outletId: string) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [completedCount, cancelledCount, revenue] = await db.$transaction([
            db.order.count({
                where: {
                    outletId,
                    orderStatus: OrderStatus.COMPLETED,
                    items: { some: { product: { type: "GOODS" } } },
                    updatedAt: { gte: startOfDay },
                },
            }),
            db.order.count({
                where: {
                    outletId,
                    orderStatus: OrderStatus.CANCELLED,
                    items: { some: { product: { type: "GOODS" } } },
                    updatedAt: { gte: startOfDay },
                },
            }),
            db.order.aggregate({
                where: {
                    outletId,
                    orderStatus: OrderStatus.COMPLETED,
                    items: { some: { product: { type: "GOODS" } } },
                    updatedAt: { gte: startOfDay },
                },
                _sum: { totalAmount: true },
            }),
        ]);

        return {
            completedCount,
            cancelledCount,
            revenue: Number(revenue._sum.totalAmount ?? 0),
        };
    }
}
