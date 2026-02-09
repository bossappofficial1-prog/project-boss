import { apiCall } from './base';

// ─── Types ──────────────────────────────────────────────
export interface BusinessOverviewSummary {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalServices: number;
    outletCount: number;
    avgOrderValue: number;
}

export interface RevenueSeriesItem {
    date: string;
    revenue: number;
    orders: number;
}

export interface PaymentBreakdown {
    online: number;
    manual: number;
}

export interface SubscriptionInfo {
    status: string;
    plan: string;
    endsAt: string | null;
    daysLeft: number | null;
}

export interface BusinessOverviewData {
    business: { id: string; name: string };
    summary: BusinessOverviewSummary;
    revenueSeries: RevenueSeriesItem[];
    productService: { products: number; services: number };
    paymentBreakdown: PaymentBreakdown;
    subscription: SubscriptionInfo | null;
}

export interface OutletPerformanceItem {
    id: string;
    name: string;
    revenue: number;
    orders: number;
    products: number;
    services: number;
}

export interface BusinessOutletsData {
    outlets: OutletPerformanceItem[];
    total: number;
}

export interface RecentOrderItem {
    id: string;
    outletId: string;
    outletName: string;
    amount: number;
    createdAt: string;
    paymentStatus: string;
    orderStatus: string;
    customerName: string;
}

export interface BusinessRecentOrdersData {
    orders: RecentOrderItem[];
}

// ─── API calls ──────────────────────────────────────────
export const businessDashboardApi = {
    getOverview: (period: 'week' | 'month' | 'year' = 'month') =>
        apiCall<BusinessOverviewData>(`/dashboard/business/overview?period=${period}`),

    getOutlets: (period: 'week' | 'month' | 'year' = 'month', top: number = 5) =>
        apiCall<BusinessOutletsData>(`/dashboard/business/outlets?period=${period}&top=${top}`),

    getRecentOrders: (limit: number = 10) =>
        apiCall<BusinessRecentOrdersData>(`/dashboard/business/recent-orders?limit=${limit}`),
};
