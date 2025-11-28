import { db } from "../config/prisma";

export class AdminV2Repository {
    static async getRevenue(
        start: Date,
        end: Date,
    ) {
        return await db.order.aggregate({
            _sum: { totalAmount: true },
            where: {
                createdAt: {
                    gte: start,
                    lt: end
                }
            }
        })
    }

    static async getStatusPlatform() {
        const [businessCount, withdrawalPendingCount, transactionFailedCount] = await Promise.all([
            await db.business.count(),
            await db.withdrawal.count({
                where: {
                    status: 'PENDING'
                }
            }),
            await db.transaction.count({
                where: {
                    OR: [
                        { status: 'EXPIRED' },
                        { status: 'CANCELLED' },
                        { status: 'EXPIRED' },
                    ]
                }
            })
        ])

        return { businessCount, withdrawalPendingCount, transactionFailedCount }
    }
}