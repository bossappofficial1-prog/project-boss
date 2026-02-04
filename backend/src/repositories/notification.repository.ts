import { db } from '../config/prisma';
import { OrderStatus, PaymentStatus, ProductType } from '@prisma/client';

export class NotificationRepository {
    static countNewOrdersToProcess(outletId: string) {
        return db.order.count({
            where: {
                outletId,
                paymentStatus: PaymentStatus.SUCCESS,
                orderStatus: { in: [OrderStatus.AWAITING_PAYMENT, OrderStatus.PROCESSING, OrderStatus.READY] },
            },
        });
    }

    static countLowStockGoods(outletId: string, threshold: number) {
        return db.productGoods.count({
            where: {
                currentStock: { lte: threshold },
                product: {
                    outletId,
                    type: ProductType.GOODS,
                },
            },
        });
    }

    static countOrdersInRange(outletId: string, start: Date, end: Date) {
        return db.order.count({
            where: {
                outletId,
                paymentStatus: PaymentStatus.SUCCESS,
                createdAt: { gte: start, lt: end },
            },
        });
    }
}
