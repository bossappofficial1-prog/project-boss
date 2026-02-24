import { PaymentStatus, SubscriptionStatus } from "@prisma/client";
import { HttpStatus } from "../constants/http-status";
import { AppError } from "../errors/app-error";
import { redis } from "../config/redis";
import { AdminDashboardRepository } from "../repositories/admin-dashboard.repository";
import {
    type AdminDashboardInsightsQuery,
    type AdminDashboardRiskQuery,
    type AdminDashboardActivityQuery,
} from "../schemas/admin-dashboard.schema";

const SUBSCRIPTION_LABELS: Record<SubscriptionStatus, string> = {
    [SubscriptionStatus.ACTIVE]: "Aktif",
    [SubscriptionStatus.EXPIRED]: "Kedaluwarsa",
    [SubscriptionStatus.SUSPENDED]: "Disuspend",
    [SubscriptionStatus.CANCELLED]: "Dibatalkan",
    [SubscriptionStatus.PAST_DUE]: "Tertunggak",
    [SubscriptionStatus.TRIAL]: "Trial",
    [SubscriptionStatus.AWAITING_PAYMENT]: "Menunggu Pembayaran",
    [SubscriptionStatus.PROOF_SUBMITTED]: "Butuh Validasi",
};

const PROOF_STATUS_ORDER: PaymentStatus[] = [
    PaymentStatus.PENDING,
    PaymentStatus.PROOF_SUBMITTED,
    PaymentStatus.AWAITING_VERIFICATION,
    PaymentStatus.SUCCESS,
    PaymentStatus.REJECTED_MANUAL,
];

export class AdminDashboardService {
    private static parseDate(input?: string) {
        if (!input) return undefined;
        const parsed = new Date(input);
        if (Number.isNaN(parsed.getTime())) {
            throw new AppError("Format tanggal tidak valid", HttpStatus.BAD_REQUEST);
        }
        return parsed;
    }

    private static resolveRange(filters: AdminDashboardInsightsQuery) {
        const parsedStart = this.parseDate(filters.startDate);
        const parsedEnd = this.parseDate(filters.endDate) ?? new Date();
        const end = new Date(parsedEnd);
        const start = parsedStart ? new Date(parsedStart) : new Date(end);

        if (!parsedStart) {
            start.setDate(start.getDate() - 29);
        }

        if (start >= end) {
            throw new AppError("Rentang tanggal tidak valid", HttpStatus.BAD_REQUEST);
        }

        const interval = filters.interval ?? "day";
        return { start, end, interval };
    }

    static async getInsights(filters: AdminDashboardInsightsQuery) {
        const { start, end, interval } = this.resolveRange(filters);
        const cacheKey = `admin:dashboard:insights:${interval}:${start.getTime()}:${end.getTime()}`;

        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            // ignore cache read errors
        }

        const [snapshot, revenueTrend, funnelMap, proofDistribution] = await Promise.all([
            AdminDashboardRepository.getSnapshotMetrics({ start, end }),
            AdminDashboardRepository.getRevenueTrend({ start, end, interval }),
            AdminDashboardRepository.getSubscriptionFunnel(),
            AdminDashboardRepository.getProofStatusDistribution({ start, end }),
        ]);

        const funnel = Object.entries(funnelMap).map(([status, count]) => ({
            status: status as SubscriptionStatus,
            label: SUBSCRIPTION_LABELS[status as SubscriptionStatus] ?? status,
            count,
        }));

        const proofMap = new Map(
            proofDistribution.map((item) => [item.status, { count: item.count, amount: item.amount }])
        );

        const proofHealth = PROOF_STATUS_ORDER.map((status) => ({
            status,
            count: proofMap.get(status)?.count ?? 0,
            amount: proofMap.get(status)?.amount ?? 0,
        }));

        const payload = {
            range: {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            },
            interval,
            snapshot,
            revenueTrend,
            funnel,
            proofHealth,
        };

        try {
            await redis.set(cacheKey, JSON.stringify(payload), "EX", 60);
        } catch (error) {
            // ignore cache write errors
        }

        return payload;
    }

    static async getRiskyMerchants(filters: AdminDashboardRiskQuery) {
        const limit = filters.limit ?? 8;
        return AdminDashboardRepository.getRiskyMerchants(limit);
    }

    static async getRecentActivities(filters: AdminDashboardActivityQuery) {
        const limit = filters.limit ?? 12;
        return AdminDashboardRepository.getRecentInvoiceActivities(limit);
    }
}
