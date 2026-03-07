import { db } from "../config/prisma";

export type DeepIsoDate<T> = T extends Date ? string :
    T extends Array<infer U> ? Array<DeepIsoDate<U>> :
    T extends object ? { [K in keyof T]: DeepIsoDate<T[K]> } :
    T;


export class OutletDashboardRepository {

    static async getDashboardSummary(outletId: string) {
        const result = await db.$queryRaw<any[]>`
            SELECT
                (SELECT COUNT(*)::int FROM "Product" WHERE "outletId" = ${outletId} AND "type" = 'GOODS') AS "totalProducts",
                (SELECT COUNT(*)::int FROM "Product" WHERE "outletId" = ${outletId} AND "type" = 'SERVICE') AS "totalServices",
                (SELECT COUNT(*)::int FROM "Order" WHERE "outletId" = ${outletId}) AS "totalOrders",
                (SELECT COALESCE(SUM("totalAmount"), 0)::float FROM "Order" WHERE "outletId" = ${outletId} AND "paymentStatus" = 'SUCCESS') AS "totalRevenue"
        `;

        return {
            totalProducts: result[0]?.totalProducts ?? 0,
            totalServices: result[0]?.totalServices ?? 0,
            totalOrders: result[0]?.totalOrders ?? 0,
            totalRevenue: result[0]?.totalRevenue ?? 0,
        };
    }

    static async getOrderStats(outletId: string, period: 'week' | 'month') {
        const now = new Date();
        const startDate = new Date();

        if (period === 'week') {
            startDate.setDate(now.getDate() - 7);
        } else { // month
            startDate.setMonth(now.getMonth() - 1);
        }

        // mencegah penarikan ribuan baris data ke memori Node.js
        const rows = await db.$queryRaw<any[]>`
            SELECT
                date_trunc('day', "createdAt") AS date,
                COUNT(*)::int AS "totalOrders",
                COALESCE(SUM(CASE WHEN "paymentStatus" = 'SUCCESS' THEN "totalAmount" ELSE 0 END), 0)::float AS "totalRevenue"
            FROM "Order"
            WHERE "outletId" = ${outletId} AND "createdAt" >= ${startDate}
            GROUP BY date_trunc('day', "createdAt")
            ORDER BY date ASC
        `;

        const statsRecord = rows.reduce((acc, row) => {
            const dateObj = row.date instanceof Date ? row.date : new Date(row.date);
            const dateKey = dateObj.toISOString().split('T')[0];

            acc[dateKey] = {
                totalOrders: row.totalOrders,
                totalRevenue: row.totalRevenue
            };
            return acc;
        }, {} as Record<string, { totalOrders: number; totalRevenue: number }>);

        return statsRecord;
    }
}