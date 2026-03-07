import { Prisma, SubscriptionStatus } from "@prisma/client";
import { db } from "../config/prisma";
import { parseAndForceIsoUtc } from "./helper";

export type DeepIsoDate<T> = T extends Date ? string :
    T extends Array<infer U> ? Array<DeepIsoDate<U>> :
    T extends object ? { [K in keyof T]: DeepIsoDate<T[K]> } :
    T;

const INTERVAL_SQL: Record<"day" | "week" | "month", Prisma.Sql> = {
    day: Prisma.sql`'day'`,
    week: Prisma.sql`'week'`,
    month: Prisma.sql`'month'`,
};

export class AdminDashboardRepository {

    static async getSnapshotMetrics(params: { start: Date; end: Date }) {
        const { start, end } = params;

        // Optimasi: 5 Prisma Query digabung menjadi 1 Raw SQL
        const result = await db.$queryRaw<any[]>`
            SELECT
                (SELECT COALESCE(SUM(amount), 0)::float FROM "SubscriptionInvoice" WHERE status = 'SUCCESS' AND "paidAt" >= ${start} AND "paidAt" <= ${end}) AS "totalRevenue",
                (SELECT COALESCE(SUM(amount), 0)::float FROM "SubscriptionInvoice" WHERE status IN ('PROOF_SUBMITTED', 'AWAITING_VERIFICATION', 'PENDING') AND "createdAt" >= ${start} AND "createdAt" <= ${end}) AS "outstandingRevenue",
                (SELECT COUNT(*)::int FROM "BusinessSubscription" WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}) AS "newSubscriptions",
                (SELECT COUNT(*)::int FROM "Business" WHERE "subscriptionStatus" = 'ACTIVE') AS "activeBusinesses",
                (SELECT COUNT(*)::int FROM "SubscriptionInvoice" WHERE status IN ('PROOF_SUBMITTED', 'AWAITING_VERIFICATION')) AS "pendingProofs"
        `;

        return {
            totalRevenue: result[0]?.totalRevenue ?? 0,
            outstandingRevenue: result[0]?.outstandingRevenue ?? 0,
            newSubscriptions: result[0]?.newSubscriptions ?? 0,
            activeBusinesses: result[0]?.activeBusinesses ?? 0,
            pendingProofs: result[0]?.pendingProofs ?? 0,
        };
    }

    static async getRevenueTrend(params: { start: Date; end: Date; interval: "day" | "week" | "month" }) {
        const { start, end, interval } = params;
        const intervalSql = INTERVAL_SQL[interval] ?? INTERVAL_SQL.day;

        const rows = await db.$queryRaw<any[]>(Prisma.sql`
            SELECT
                date_trunc(${intervalSql}, "createdAt") AS bucket,
                COALESCE(SUM("amount"), 0)::float AS "billedAmount",
                COALESCE(SUM(CASE WHEN "status" = 'SUCCESS' THEN "amount" ELSE 0 END), 0)::float AS "paidAmount"
            FROM "SubscriptionInvoice"
            WHERE "createdAt" BETWEEN ${start} AND ${end}
            GROUP BY bucket
            ORDER BY bucket ASC
        `);

        return parseAndForceIsoUtc(rows);
    }

    static async getSubscriptionFunnel() {
        const rows = await db.$queryRaw<{ status: string, count: number }[]>`
            SELECT "subscriptionStatus" AS status, COUNT(*)::int AS count
            FROM "Business"
            GROUP BY "subscriptionStatus"
        `;

        // Siapkan struktur default 0 untuk semua status
        const defaults = Object.values(SubscriptionStatus).reduce<Record<string, number>>((acc, status) => {
            acc[status] = 0;
            return acc;
        }, {});

        // Gabungkan dengan hasil SQL
        rows.forEach((row) => {
            defaults[row.status] = row.count;
        });

        return defaults;
    }

    static async getProofStatusDistribution(params: { start: Date; end: Date }) {
        const rows = await db.$queryRaw<any[]>`
            SELECT 
                "status",
                COUNT(*)::int AS count,
                COALESCE(SUM(amount), 0)::float AS amount
            FROM "SubscriptionInvoice"
            WHERE "createdAt" BETWEEN ${params.start} AND ${params.end}
            GROUP BY "status"
        `;

        return rows;
    }

    static async getRiskyMerchants(limit: number) {
        // Optimasi Masif: Mengganti manipulasi memori Node.js yang berat dengan SQL agregasi penuh
        const rawMerchants = await db.$queryRaw<any[]>`
            SELECT 
                b.id AS "businessId",
                SUM(CASE WHEN i.status IN ('PROOF_SUBMITTED', 'AWAITING_VERIFICATION', 'PENDING') THEN 1 ELSE 0 END)::int AS "pendingInvoices",
                SUM(CASE WHEN i.status = 'REJECTED_MANUAL' THEN 1 ELSE 0 END)::int AS "rejectedInvoices",
                SUM(CASE WHEN i.status = 'FAILED' THEN 1 ELSE 0 END)::int AS "failedInvoices",
                COALESCE(SUM(CASE WHEN i.status IN ('PROOF_SUBMITTED', 'AWAITING_VERIFICATION', 'PENDING') THEN i.amount ELSE 0 END), 0)::float AS "outstandingAmount",
                MAX(i."updatedAt") AS "lastActivityAt",
                json_build_object(
                    'id', b.id,
                    'name', b.name,
                    'subscriptionStatus', b."subscriptionStatus",
                    'owner', json_build_object(
                        'id', u.id,
                        'name', u.name,
                        'email', u.email,
                        'phone', u.phone
                    )
                ) AS business
            FROM "SubscriptionInvoice" i
            JOIN "Business" b ON i."businessId" = b.id
            JOIN "User" u ON b."ownerId" = u.id
            WHERE i.status IN ('PROOF_SUBMITTED', 'AWAITING_VERIFICATION', 'PENDING', 'REJECTED_MANUAL', 'FAILED')
            GROUP BY b.id, b.name, b."subscriptionStatus", u.id, u.name, u.email, u.phone
            HAVING SUM(CASE WHEN i.status IN ('PROOF_SUBMITTED', 'AWAITING_VERIFICATION', 'PENDING') THEN 1 ELSE 0 END) > 0 
                OR SUM(CASE WHEN i.status = 'REJECTED_MANUAL' THEN 1 ELSE 0 END) > 0
            ORDER BY "outstandingAmount" DESC, "pendingInvoices" DESC
            LIMIT ${limit}
        `;

        return parseAndForceIsoUtc(rawMerchants);
    }

    static async getRecentInvoiceActivities(limit: number) {
        const rawActivities = await db.$queryRaw<any[]>`
            SELECT 
                i.id,
                i."invoiceNumber",
                i.amount,
                i.status,
                i."updatedAt",
                (
                    SELECT json_build_object(
                        'id', b.id,
                        'name', b.name,
                        'owner', (
                            SELECT json_build_object(
                                'id', u.id,
                                'name', u.name,
                                'email', u.email
                            ) 
                            FROM "User" u 
                            WHERE u.id = b."ownerId"
                        )
                    ) 
                    FROM "Business" b 
                    WHERE b.id = i."businessId"
                ) AS business
            FROM "SubscriptionInvoice" i
            WHERE i.status IN ('PROOF_SUBMITTED', 'AWAITING_VERIFICATION', 'SUCCESS', 'REJECTED_MANUAL')
            ORDER BY i."updatedAt" DESC
            LIMIT ${limit}
        `;

        return parseAndForceIsoUtc(rawActivities);
    }
}