import { AdminV2Repository } from "../repositories/adminv2.repository";
import { redis } from "../config/redis";

export class AdminV2Service {
    static async getMetrics() {
        // const cacheKey = `admin:metrics`;
        // try {
        //     const cached = await redis.get(cacheKey);
        //     if (cached) {
        //         try {
        //             return JSON.parse(cached);
        //         } catch (err) {
        //             // ignore parse error and continue to recalculate
        //         }
        //     }
        // } catch (err) {
        //     // ignore redis errors and continue
        // }
        const today = new Date();
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

        const todayRevenue = await AdminV2Repository.getRevenue(today, tomorrow);
        const yesterdayRevenue = await AdminV2Repository.getRevenue(yesterday, dayBeforeYesterday);
        const weekRevenue = await AdminV2Repository.getRevenue(startOfWeek, endOfWeek)
        const lastWeekRevenue = await AdminV2Repository.getRevenue(lastWeekStart, lastWeekEnd)
        const monthRevenue = await AdminV2Repository.getRevenue(startOfMonth, startOfNextMonth)
        const lastMonthRevenue = await AdminV2Repository.getRevenue(startOfLastMonth, startOfThisMonth)
        const platformStatus = await AdminV2Repository.getStatusPlatform();

        const todayVal = todayRevenue._sum.totalAmount || 0;
        const yesterdayVal = yesterdayRevenue._sum.totalAmount || 0;
        const weekRevenueVal = weekRevenue._sum.totalAmount || 0;
        const lastWeekRevenueVal = lastWeekRevenue._sum.totalAmount || 0;
        const monthRevenueVal = monthRevenue._sum.totalAmount || 0;
        const lastMonthRevenueVal = lastMonthRevenue._sum.totalAmount || 0;

        const result = {
            today: todayVal,
            todayGrowth: this.calculatePrecentege(todayVal, 23),
            week: weekRevenueVal,
            weekGrowth: this.calculatePrecentege(weekRevenueVal, lastWeekRevenueVal),
            month: monthRevenueVal,
            monthGrowth: this.calculatePrecentege(monthRevenueVal, lastMonthRevenueVal),
            businessActive: platformStatus.businessCount,
            withdrawalPending: platformStatus.withdrawalPendingCount,
            failedTransaction: platformStatus.transactionFailedCount
        };

        // Cache the metrics for a short period to reduce DB load
        // try {
        //     const ttlSeconds = 60; // cache 60 seconds
        //     await redis.set(cacheKey, JSON.stringify(result), 'EX', ttlSeconds);
        // } catch (err) {
        //     // ignore cache set errors
        // }

        return result;
    }

    private static calculatePrecentege(currentValue: number, previousValue: number) {
        return Math.round((previousValue === 0 ? 0 : ((currentValue - previousValue) / previousValue) * 100) * 100) / 100;
    }
}