import { PaymentStatus, Prisma, SubscriptionStatus } from "@prisma/client";
import { db } from "../config/prisma";

const INTERVAL_SQL: Record<"day" | "week" | "month", Prisma.Sql> = {
    day: Prisma.sql`'day'`,
    week: Prisma.sql`'week'`,
    month: Prisma.sql`'month'`,
};

const RISKY_STATUSES: PaymentStatus[] = [
    PaymentStatus.PROOF_SUBMITTED,
    PaymentStatus.AWAITING_VERIFICATION,
    PaymentStatus.PENDING,
    PaymentStatus.REJECTED_MANUAL,
    PaymentStatus.FAILED,
];

const OUTSTANDING_STATUSES: PaymentStatus[] = [
    PaymentStatus.PROOF_SUBMITTED,
    PaymentStatus.AWAITING_VERIFICATION,
    PaymentStatus.PENDING,
];

export class AdminDashboardRepository {
    static async getSnapshotMetrics(params: { start: Date; end: Date }) {
        const { start, end } = params;

        const [revenue, outstanding, newSubscriptions, activeBusinesses, pendingProofs] = await db.$transaction([
            db.subscriptionInvoice.aggregate({
                where: {
                    status: PaymentStatus.SUCCESS,
                    paidAt: { gte: start, lte: end },
                },
                _sum: { amount: true },
            }),
            db.subscriptionInvoice.aggregate({
                where: {
                    status: { in: OUTSTANDING_STATUSES },
                    createdAt: { gte: start, lte: end },
                },
                _sum: { amount: true },
            }),
            db.businessSubscription.count({
                where: {
                    createdAt: { gte: start, lte: end },
                },
            }),
            db.business.count({
                where: { subscriptionStatus: SubscriptionStatus.ACTIVE },
            }),
            db.subscriptionInvoice.count({
                where: { status: { in: [PaymentStatus.PROOF_SUBMITTED, PaymentStatus.AWAITING_VERIFICATION] } },
            }),
        ]);

        return {
            totalRevenue: Number(revenue._sum.amount ?? 0),
            outstandingRevenue: Number(outstanding._sum.amount ?? 0),
            newSubscriptions,
            activeBusinesses,
            pendingProofs,
        };
    }

    static async getRevenueTrend(params: { start: Date; end: Date; interval: "day" | "week" | "month" }) {
        const { start, end, interval } = params;
        const intervalSql = INTERVAL_SQL[interval] ?? INTERVAL_SQL.day;

        type TrendRow = {
            bucket: Date;
            billed_amount: Prisma.Decimal | number | null;
            paid_amount: Prisma.Decimal | number | null;
        };

        const rows = await db.$queryRaw<TrendRow[]>(Prisma.sql`
            SELECT
                date_trunc(${intervalSql}, "createdAt") AS bucket,
                SUM("amount") AS billed_amount,
                SUM(CASE WHEN "status" = ${PaymentStatus.SUCCESS} THEN "amount" ELSE 0 END) AS paid_amount
            FROM "SubscriptionInvoice"
            WHERE "createdAt" BETWEEN ${start} AND ${end}
            GROUP BY bucket
            ORDER BY bucket ASC
        `);

        return rows.map((row) => ({
            bucket: row.bucket instanceof Date ? row.bucket.toISOString() : new Date(row.bucket).toISOString(),
            billedAmount: Number(row.billed_amount ?? 0),
            paidAmount: Number(row.paid_amount ?? 0),
        }));
    }

    static async getSubscriptionFunnel() {
        const groups = await db.business.groupBy({
            by: ["subscriptionStatus"],
            _count: { _all: true },
        });

        const defaults = Object.values(SubscriptionStatus).reduce<Record<string, number>>((acc, status) => {
            acc[status] = 0;
            return acc;
        }, {});

        groups.forEach((group) => {
            defaults[group.subscriptionStatus] = group._count._all;
        });

        return defaults;
    }

    static async getProofStatusDistribution(params: { start: Date; end: Date }) {
        const rows = await db.subscriptionInvoice.groupBy({
            by: ["status"],
            where: { createdAt: { gte: params.start, lte: params.end } },
            _count: { _all: true },
            _sum: { amount: true },
        });

        return rows.map((row) => ({
            status: row.status,
            count: row._count._all,
            amount: Number(row._sum.amount ?? 0),
        }));
    }

    static async getRiskyMerchants(limit: number) {
        const aggregates = await db.subscriptionInvoice.groupBy({
            by: ["businessId", "status"],
            where: { status: { in: RISKY_STATUSES } },
            _count: { _all: true },
            _sum: { amount: true },
        });

        const lastTouch = await db.subscriptionInvoice.groupBy({
            by: ["businessId"],
            where: { status: { in: RISKY_STATUSES } },
            _max: { updatedAt: true },
        });

        type RiskAggregate = {
            businessId: string;
            pendingInvoices: number;
            rejectedInvoices: number;
            failedInvoices: number;
            outstandingAmount: number;
            lastActivityAt?: Date;
        };

        const stats = new Map<string, RiskAggregate>();

        aggregates.forEach((row) => {
            const current = stats.get(row.businessId ?? 'default') ?? {
                businessId: row.businessId ?? 'default',
                pendingInvoices: 0,
                rejectedInvoices: 0,
                failedInvoices: 0,
                outstandingAmount: 0,
            };

            if (OUTSTANDING_STATUSES.includes(row.status)) {
                current.pendingInvoices += row._count._all;
                current.outstandingAmount += Number(row._sum.amount ?? 0);
            }

            if (row.status === PaymentStatus.REJECTED_MANUAL) {
                current.rejectedInvoices += row._count._all;
            }

            if (row.status === PaymentStatus.FAILED) {
                current.failedInvoices += row._count._all;
            }

            stats.set(row.businessId || 'default', current);
        });

        lastTouch.forEach((row) => {
            const current = stats.get(row.businessId || 'default');
            if (current) {
                current.lastActivityAt = row._max.updatedAt ?? undefined;
            }
        });

        const ranked = Array.from(stats.values())
            .filter((item) => item.pendingInvoices > 0 || item.rejectedInvoices > 0)
            .sort((a, b) => {
                if (b.outstandingAmount !== a.outstandingAmount) {
                    return b.outstandingAmount - a.outstandingAmount;
                }
                return b.pendingInvoices - a.pendingInvoices;
            })
            .slice(0, limit);

        if (ranked.length === 0) {
            return [];
        }

        const businesses = await db.business.findMany({
            where: { id: { in: ranked.map((item) => item.businessId) } },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });

        const businessMap = new Map(businesses.map((business) => [business.id, business]));

        return ranked.map((item) => {
            const business = businessMap.get(item.businessId);
            return {
                ...item,
                business: business
                    ? {
                        id: business.id,
                        name: business.name,
                        subscriptionStatus: business.subscriptionStatus,
                        owner: business.owner
                            ? {
                                id: business.owner.id,
                                name: business.owner.name,
                                email: business.owner.email,
                                phone: business.owner.phone,
                            }
                            : null,
                    }
                    : null,
            };
        });
    }

    static async getRecentInvoiceActivities(limit: number) {
        const activities = await db.subscriptionInvoice.findMany({
            where: {
                status: {
                    in: [
                        PaymentStatus.PROOF_SUBMITTED,
                        PaymentStatus.AWAITING_VERIFICATION,
                        PaymentStatus.SUCCESS,
                        PaymentStatus.REJECTED_MANUAL,
                    ]
                }
            },
            include: {
                business: {
                    select: {
                        id: true,
                        name: true,
                        owner: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: { updatedAt: "desc" },
            take: limit,
        });

        return activities.map((activity) => ({
            id: activity.id,
            invoiceNumber: activity.invoiceNumber,
            amount: activity.amount,
            status: activity.status,
            updatedAt: activity.updatedAt,
            business: activity.business,
        }));
    }
}
