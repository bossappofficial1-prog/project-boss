import { db } from "../config/prisma";

export class AdminV2Repository {
    static async getRevenueSum(
        start: Date,
        end: Date,
    ) {
        return await db.order.aggregate({
            _sum: { totalAmount: true },
            where: {
                AND: [
                    {
                        createdAt: {
                            gte: start,
                            lt: end
                        }
                    },
                    {
                        OR: [
                            { paymentStatus: 'PROOF_SUBMITTED' },
                            { paymentStatus: 'SUCCESS' },
                        ]
                    }
                ]
            }
        })
    }

    static async getRevenueGrouped(
        start: Date,
        end: Date,
        interval: 'hour' | 'day' | 'week' | 'month' | 'year'
    ) {
        return await db.$queryRaw<
            { bucket: Date; total: number }[]
        >`
        WITH grouped AS (
            SELECT
                date_trunc(${interval}, "createdAt") AS bucket,
                SUM("totalAmount") AS total
            FROM "Order"
            WHERE 
                "createdAt" >= ${start}
                AND "createdAt" < ${end}
                AND (
                    "paymentStatus" = 'PROOF_SUBMITTED'
                    OR "paymentStatus" = 'SUCCESS'
                )
            GROUP BY bucket
            ORDER BY bucket
        )
        SELECT bucket, total FROM grouped;
    `;
    }




    static async getStatusPlatform() {
        const [businessCount, transactionFailedCount] = await Promise.all([
            await db.business.count(),

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

        return { businessCount, transactionFailedCount }
    }
}