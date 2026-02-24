import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apis/base";

export interface SubscriptionIncomeSummary {
    mrr: number;
    arr: number;
    mrrGrowth: number;
    activeSubscriptions: number;
    expiringSoon: number;
    overdueInvoices: number;
    overdueAmount: number;
    averageContractValue: number;
}

export interface SubscriptionIncomeTrendPoint {
    date: string;
    revenue: number;
    invoices: number;
}

export interface SubscriptionIncomeTrend {
    period: string;
    months: number;
    points: SubscriptionIncomeTrendPoint[];
}

export interface SubscriptionPlanDistribution {
    planCode: string;
    planName: string;
    businesses: number;
    percentage: number;
    mrrContribution: number;
}

export interface SubscriptionInvoiceStatus {
    status: string;
    invoices: number;
    amount: number;
}

export interface SubscriptionUpcomingRenewal {
    subscriptionId: string;
    businessId: string;
    businessName: string;
    planCode: string;
    planName: string;
    endsAt: string;
    daysRemaining: number;
}

export interface SubscriptionRecentInvoice {
    id: string;
    invoiceNumber: string;
    businessId: string;
    businessName: string;
    amount: number;
    status: string;
    issuedAt: string;
    paidAt: string | null;
    planName: string;
}

export interface SubscriptionIncomeResponse {
    summary: SubscriptionIncomeSummary;
    revenueTrend: SubscriptionIncomeTrend;
    planDistribution: SubscriptionPlanDistribution[];
    invoiceStatus: SubscriptionInvoiceStatus[];
    upcomingRenewals: SubscriptionUpcomingRenewal[];
    recentInvoices: SubscriptionRecentInvoice[];
}

const fetchSubscriptionIncome = async (months: number): Promise<SubscriptionIncomeResponse> => {
    const response = await apiClient.get(`/admin/platform-income/subscriptions`, {
        params: { months },
    });
    return response.data.data;
};

export const useSubscriptionIncome = (months: number) => {
    return useQuery({
        queryKey: ["subscription-income", months],
        queryFn: () => fetchSubscriptionIncome(months),
        staleTime: 60 * 1000,
    });
};
