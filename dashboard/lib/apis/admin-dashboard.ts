import { apiCall } from "./base";

export type AdminDashboardInterval = "day" | "week" | "month";

export interface DashboardRange {
    startDate: string;
    endDate: string;
}

export interface DashboardSnapshot {
    totalRevenue: number;
    outstandingRevenue: number;
    newSubscriptions: number;
    activeBusinesses: number;
    pendingProofs: number;
}

export interface RevenueTrendPoint {
    bucket: string;
    billedAmount: number;
    paidAmount: number;
}

export interface SubscriptionFunnelSlice {
    status: string;
    label: string;
    count: number;
}

export interface ProofHealthSlice {
    status: string;
    count: number;
    amount: number;
}

export interface AdminDashboardInsightsResponse {
    range: DashboardRange;
    interval: AdminDashboardInterval;
    snapshot: DashboardSnapshot;
    revenueTrend: RevenueTrendPoint[];
    funnel: SubscriptionFunnelSlice[];
    proofHealth: ProofHealthSlice[];
}

export interface AdminDashboardRiskRecord {
    businessId: string;
    pendingInvoices: number;
    rejectedInvoices: number;
    failedInvoices: number;
    outstandingAmount: number;
    lastActivityAt?: string;
    business: {
        id: string;
        name: string;
        subscriptionStatus: string;
        owner?: {
            id: string;
            name: string;
            email: string;
            phone?: string | null;
        } | null;
    } | null;
}

export interface AdminDashboardActivityRecord {
    id: string;
    invoiceNumber: string;
    amount: number;
    status: string;
    updatedAt: string;
    business: {
        id: string;
        name: string;
        owner?: {
            id: string;
            name: string;
            email: string;
        } | null;
    } | null;
}

export interface AdminDashboardInsightsParams {
    startDate: string;
    endDate: string;
    interval: AdminDashboardInterval;
}

export const adminDashboardApi = {
    getInsights(params: AdminDashboardInsightsParams) {
        const searchParams = new URLSearchParams({
            startDate: params.startDate,
            endDate: params.endDate,
            interval: params.interval,
        });

        return apiCall<AdminDashboardInsightsResponse>(`/admin/dashboard/v3/insights?${searchParams.toString()}`);
    },

    getRiskyMerchants(limit?: number) {
        const searchParams = new URLSearchParams();
        if (limit) {
            searchParams.set("limit", String(limit));
        }

        const query = searchParams.toString();
        const suffix = query ? `?${query}` : "";
        return apiCall<AdminDashboardRiskRecord[]>(`/admin/dashboard/v3/risk-merchants${suffix}`);
    },

    getRecentActivities(limit?: number) {
        const searchParams = new URLSearchParams();
        if (limit) {
            searchParams.set("limit", String(limit));
        }

        const query = searchParams.toString();
        const suffix = query ? `?${query}` : "";
        return apiCall<AdminDashboardActivityRecord[]>(`/admin/dashboard/v3/activities${suffix}`);
    },
};
