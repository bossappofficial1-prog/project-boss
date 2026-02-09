import { db } from "../config/prisma";
import { OrderStatus } from "@prisma/client";

const ACTIVE_QUEUE_STATUSES: OrderStatus[] = [
    OrderStatus.AWAITING_PAYMENT,
    OrderStatus.PROCESSING,
    OrderStatus.CONFIRMED,
    OrderStatus.READY,
    OrderStatus.ON_GOING,
];

const queueInclude = {
    items: {
        include: {
            product: {
                include: { service: true, goods: true },
            },
            bookingSlot: true,
        },
    },
    guestCustomer: true,
    outlet: true,
    transaction: true,
    handledByStaff: true,
} as const;

export class QueueV2Repository {
    static async getActiveQueueByOutlet(outletId: string) {
        return db.order.findMany({
            where: {
                outletId,
                orderStatus: { in: ACTIVE_QUEUE_STATUSES },
                items: { some: { product: { type: "SERVICE" } } },
            },
            include: queueInclude,
            orderBy: { createdAt: "asc" },
        });
    }

    static async getCompletedTodayByOutlet(outletId: string) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        return db.order.findMany({
            where: {
                outletId,
                orderStatus: OrderStatus.COMPLETED,
                items: { some: { product: { type: "SERVICE" } } },
                updatedAt: { gte: startOfDay },
            },
            include: queueInclude,
            orderBy: { updatedAt: "desc" },
        });
    }

    static async getCancelledTodayCount(outletId: string) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        return db.order.count({
            where: {
                outletId,
                orderStatus: OrderStatus.CANCELLED,
                items: { some: { product: { type: "SERVICE" } } },
                updatedAt: { gte: startOfDay },
            },
        });
    }

    static async getOrderById(orderId: string) {
        return db.order.findUnique({
            where: { id: orderId },
            include: queueInclude,
        });
    }
}
