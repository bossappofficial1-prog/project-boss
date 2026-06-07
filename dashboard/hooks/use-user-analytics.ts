import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { DashboardService } from "@/lib/services/dashboard.service";
import type { User } from "@/types/user";

const SAMPLE_LIMIT = 100;
export const USER_ANALYTICS_SAMPLE = SAMPLE_LIMIT;

export interface SignupTrendPoint {
    date: string;
    total: number;
    verified: number;
}

export interface CohortBreakdownItem {
    label: string;
    value: number;
    percent: number;
}

export interface UserAnalyticsPayload {
    totalUsers: number;
    periodDays: number;
    newUsers: number;
    avgDailySignups: number;
    verificationRate: number;
    growthRate: number;
    startDate: string;
    endDate: string;
    roleDistribution: CohortBreakdownItem[];
    verificationDistribution: CohortBreakdownItem[];
    providerDistribution: CohortBreakdownItem[];
    signupTrend: SignupTrendPoint[];
    recentUsers: User[];
}

const buildAnalytics = (
    users: User[] = [],
    totalUsers: number,
    periodDays: number
): UserAnalyticsPayload => {
    const now = new Date();
    const periodEnd = now;
    const periodStart = new Date(now);
    periodStart.setHours(0, 0, 0, 0);
    periodStart.setDate(periodStart.getDate() - (periodDays - 1));

    const previousPeriodStart = new Date(periodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays);
    const previousPeriodEnd = new Date(periodStart);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);

    const inPeriod = users.filter((user) => {
        const createdAt = new Date(user.createdAt);
        return createdAt >= periodStart && createdAt <= periodEnd;
    });

    const previousPeriod = users.filter((user) => {
        const createdAt = new Date(user.createdAt);
        return createdAt >= previousPeriodStart && createdAt <= previousPeriodEnd;
    });

    const verifiedCount = inPeriod.filter((user) => user.isVerified).length;
    const owners = inPeriod.filter((user) => user.role === "OWNER").length;
    const admins = inPeriod.filter((user) => user.role === "ADMIN").length;
    const localProvider = inPeriod.filter((user) => user.provider !== "google").length;
    const googleProvider = inPeriod.filter((user) => user.provider === "google").length;

    const signupBuckets = new Map<string, { total: number; verified: number }>();
    inPeriod.forEach((user) => {
        const key = new Date(user.createdAt).toISOString().split("T")[0];
        const bucket = signupBuckets.get(key) ?? { total: 0, verified: 0 };
        bucket.total += 1;
        bucket.verified += user.isVerified ? 1 : 0;
        signupBuckets.set(key, bucket);
    });

    const signupTrend: SignupTrendPoint[] = [];
    for (let i = 0; i < periodDays; i += 1) {
        const cursor = new Date(periodStart);
        cursor.setDate(cursor.getDate() + i);
        const key = cursor.toISOString().split("T")[0];
        const bucket = signupBuckets.get(key) ?? { total: 0, verified: 0 };
        signupTrend.push({
            date: key,
            total: bucket.total,
            verified: bucket.verified,
        });
    }

    const verificationRate = inPeriod.length > 0 ? (verifiedCount / inPeriod.length) * 100 : 0;
    const avgDailySignups = periodDays > 0 ? inPeriod.length / periodDays : 0;
    const growthRate = previousPeriod.length > 0
        ? ((inPeriod.length - previousPeriod.length) / previousPeriod.length) * 100
        : inPeriod.length > 0 ? 100 : 0;

    const formatPercent = (value: number, base: number) => (base > 0 ? (value / base) * 100 : 0);

    return {
        totalUsers,
        periodDays,
        newUsers: inPeriod.length,
        avgDailySignups,
        verificationRate,
        growthRate,
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
        roleDistribution: [
            { label: "Owners", value: owners, percent: formatPercent(owners, inPeriod.length) },
            { label: "Admins", value: admins, percent: formatPercent(admins, inPeriod.length) },
        ],
        verificationDistribution: [
            { label: "Verified", value: verifiedCount, percent: formatPercent(verifiedCount, inPeriod.length) },
            { label: "Unverified", value: inPeriod.length - verifiedCount, percent: formatPercent(inPeriod.length - verifiedCount, inPeriod.length) },
        ],
        providerDistribution: [
            { label: "Email", value: localProvider, percent: formatPercent(localProvider, inPeriod.length) },
            { label: "Google OAuth", value: googleProvider, percent: formatPercent(googleProvider, inPeriod.length) },
        ],
        signupTrend,
        recentUsers: inPeriod.slice(0, 8),
    };
};

export const useUserAnalytics = (periodDays: number = 30) => {
    const usersQuery = useQuery({
        queryKey: ["user-analytics", periodDays],
        queryFn: () => userApi.getUsers({
            page: 1,
            limit: SAMPLE_LIMIT,
            sortBy: "createdAt",
            sortOrder: "desc",
        }),
        staleTime: 60 * 1000,
    });

    const overviewQuery = useQuery({
        queryKey: ["dashboard-overview"],
        queryFn: DashboardService.getDashboardOverview,
        staleTime: 5 * 60 * 1000,
    });

    const analytics = useMemo(() => {
        if (!usersQuery.data) {
            return buildAnalytics([], overviewQuery.data?.metrics?.totalUsers ?? 0, periodDays);
        }

        const sampledUsers = usersQuery.data.data ?? [];
        const totalUsers = overviewQuery.data?.metrics?.totalUsers ?? usersQuery.data.pagination?.total ?? sampledUsers.length;

        return buildAnalytics(sampledUsers, totalUsers, periodDays);
    }, [usersQuery.data, overviewQuery.data, periodDays]);

    const refetchAll = async () => {
        await Promise.all([usersQuery.refetch(), overviewQuery.refetch()]);
    };

    return {
        analytics,
        overview: overviewQuery.data?.metrics,
        recentActivities: overviewQuery.data?.recentActivities ?? [],
        pagination: usersQuery.data?.pagination,
        rawUsers: usersQuery.data?.data ?? [],
        isLoading: usersQuery.isLoading || overviewQuery.isLoading,
        isRefetching: usersQuery.isRefetching || overviewQuery.isRefetching,
        error: usersQuery.error || overviewQuery.error,
        refetch: refetchAll,
    };
};
