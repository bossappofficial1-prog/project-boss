import { z } from "zod";

// ─── Query validation ─────────────────────────────────────
export const businessOverviewQuerySchema = z.object({
    period: z.enum(["week", "month", "year"]).default("month"),
});

export const businessOutletsQuerySchema = z.object({
    period: z.enum(["week", "month", "year"]).default("month"),
    top: z.coerce.number().int().min(1).max(20).default(5),
});

export const businessRecentOrdersQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type BusinessOverviewQuery = z.infer<typeof businessOverviewQuerySchema>;
export type BusinessOutletsQuery = z.infer<typeof businessOutletsQuerySchema>;
export type BusinessRecentOrdersQuery = z.infer<typeof businessRecentOrdersQuerySchema>;

// ─── Response types ───────────────────────────────────────
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

export interface BusinessOverviewResponse {
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

export interface BusinessOutletsResponse {
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

export interface BusinessRecentOrdersResponse {
    orders: RecentOrderItem[];
}
