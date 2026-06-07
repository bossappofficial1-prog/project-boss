import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apis/base";

export type RevenuePeriod = "daily" | "weekly" | "monthly";

export interface RevenueTrendPoint {
    date: string;
    revenue: number;
    transactions: number;
    period: RevenuePeriod;
}

export interface RevenueTrendSummary {
    totalRevenue: number;
    totalTransactions: number;
    averageRevenue: number;
    period: string;
}

export interface RevenueTrendResponse {
    chartData: RevenueTrendPoint[];
    summary: RevenueTrendSummary;
}

export interface RevenueInsightsSummary {
    windowStart: string;
    windowEnd: string;
    totalRevenue: number;
    netRevenue: number;
    totalTransactions: number;
    averageOrderValue: number;
    revenueGrowth: number;
    mrr: number;
    arr: number;
    churnRate: number;
    activeSubscriptions: number;
}

export interface RevenueFeeBreakdown {
    grossRevenue: number;
    appFees: number;
    paymentFees: number;
    netRevenue: number;
}

export interface RevenuePaymentMethod {
    method: string;
    totalAmount: number;
    transactionCount: number;
    percentage: number;
}

export interface RevenuePlanDistribution {
    plan: string;
    businesses: number;
    percentage: number;
}

export interface RevenueTopBusiness {
    businessId: string;
    businessName: string;
    totalRevenue: number;
    totalOrders: number;
}

export interface RevenueInsightsResponse {
    summary: RevenueInsightsSummary;
    feeBreakdown: RevenueFeeBreakdown;
    paymentMethods: RevenuePaymentMethod[];
    subscriptionPlans: RevenuePlanDistribution[];
    topBusinesses: RevenueTopBusiness[];
}

const fetchRevenueTrend = async (period: RevenuePeriod): Promise<RevenueTrendResponse> => {
    const response = await apiClient.get(`/admin/analytics/revenue`, { params: { period } });
    return response.data.data;
};

const fetchRevenueInsights = async (): Promise<RevenueInsightsResponse> => {
    const response = await apiClient.get(`/admin/analytics/revenue/insights`);
    return response.data.data;
};

export const useRevenueAnalytics = (period: RevenuePeriod) => {
    const trendQuery = useQuery({
        queryKey: ["revenue-trend", period],
        queryFn: () => fetchRevenueTrend(period),
    });

    const insightsQuery = useQuery({
        queryKey: ["revenue-insights"],
        queryFn: fetchRevenueInsights,
        staleTime: 60 * 1000,
    });

    return {
        period,
        trend: trendQuery.data,
        insights: insightsQuery.data,
        isLoading: trendQuery.isLoading || insightsQuery.isLoading,
        isRefetching: trendQuery.isRefetching || insightsQuery.isRefetching,
        error: trendQuery.error || insightsQuery.error,
        refetch: () => {
            trendQuery.refetch();
            insightsQuery.refetch();
        },
    };
};
