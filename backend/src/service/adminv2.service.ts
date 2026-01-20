import { AdminV2Repository } from "../repositories/adminv2.repository";
import { redis } from "../config/redis";

export class AdminV2Service {
    static async getMetrics() {
        const cacheKey = `admin:metrics`;
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                try {
                    return JSON.parse(cached);
                } catch (err) {
                    // ignore parse error and continue to recalculate
                }
            }
        } catch (err) {
            // ignore redis errors and continue
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1);

        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        const dayBeforeYesterday = new Date(today)
        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay())
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 7);

        const lastWeekStart = new Date(startOfWeek);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);

        const lastWeekEnd = new Date(startOfWeek);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const todayRevenue = await AdminV2Repository.getRevenueSum(today, tomorrow);
        const yesterdayRevenue = await AdminV2Repository.getRevenueSum(yesterday, dayBeforeYesterday);
        const weekRevenue = await AdminV2Repository.getRevenueSum(startOfWeek, endOfWeek)
        const lastWeekRevenue = await AdminV2Repository.getRevenueSum(lastWeekStart, lastWeekEnd)
        const monthRevenue = await AdminV2Repository.getRevenueSum(startOfMonth, startOfNextMonth)
        const lastMonthRevenue = await AdminV2Repository.getRevenueSum(startOfLastMonth, startOfThisMonth)
        const platformStatus = await AdminV2Repository.getStatusPlatform();

        const todayVal = todayRevenue._sum.totalAmount || 0;
        const yesterdayVal = yesterdayRevenue._sum.totalAmount || 0;
        const weekRevenueVal = weekRevenue._sum.totalAmount || 0;
        const lastWeekRevenueVal = lastWeekRevenue._sum.totalAmount || 0;
        const monthRevenueVal = monthRevenue._sum.totalAmount || 0;
        const lastMonthRevenueVal = lastMonthRevenue._sum.totalAmount || 0;

        const result = {
            today: todayVal,
            todayGrowth: this.calculatePrecentege(todayVal, yesterdayVal),
            week: weekRevenueVal,
            weekGrowth: this.calculatePrecentege(weekRevenueVal, lastWeekRevenueVal),
            month: monthRevenueVal,
            monthGrowth: this.calculatePrecentege(monthRevenueVal, lastMonthRevenueVal),
            businessActive: platformStatus.businessCount,
            failedTransaction: platformStatus.transactionFailedCount
        };

        // Cache the metrics for a short period to reduce DB load
        try {
            const ttlSeconds = 60; // cache 60 seconds
            await redis.set(cacheKey, JSON.stringify(result), 'EX', ttlSeconds);
        } catch (err) {
            // ignore cache set errors
        }

        return result;
    }

    private static calculatePrecentege(currentValue: number, previousValue: number) {
        return Math.round((previousValue === 0 ? 0 : ((currentValue - previousValue) / previousValue) * 100) * 100) / 100;
    }

    static detectInterval(start: Date, end: Date): "hour" | "day" | "week" | "month" | "year" {
        const diffMs = end.getTime() - start.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        const diffDays = diffHours / 24;
        const diffMonths = diffDays / 30;

        if (diffHours <= 24) return "hour";       // 1H
        if (diffDays <= 7) return "day";          // 1W
        if (diffDays <= 31) return "week";        // 1M
        if (diffMonths <= 12) return "month";     // 1Y
        return "year";                            // >= 1Y
    }

    static async getRevenueInRange(from: string, to: string) {
        const start = new Date(from);
        const end = new Date(to);

        const interval = this.detectInterval(start, end);

        const rows = await AdminV2Repository.getRevenueGrouped(start, end, interval);

        return rows.map((row) => ({
            total: Number(row.total),
            name: this.formatLabel(row.bucket as any, interval),
        }));
    }

    static formatLabel(bucket: string, interval: string) {
        const date = new Date(bucket);

        switch (interval) {
            case "hour":
                return date.toLocaleString("id-ID", {
                    hour: "2-digit",
                    day: "2-digit",
                    month: "short"
                });

            case "day":
                return date.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short"
                });

            case "week":
                return "Minggu " + date.toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                });

            case "month":
                return date.toLocaleDateString("id-ID", {
                    month: "short",
                    year: "numeric"
                });

            case "year":
                return date.getFullYear().toString();

            default:
                return bucket;
        }
    }

}