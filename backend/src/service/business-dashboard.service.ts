import { redis } from "../config/redis";
import { BusinessDashboardRepository } from "../repositories/business-dashboard.repository";
import type {
    BusinessOverviewResponse,
    BusinessOutletsResponse,
    BusinessRecentOrdersResponse,
} from "../schemas/business-dashboard.schema";

const CACHE_TTL = 120; // 2 minutes

function cacheKey(prefix: string, businessId: string, extra?: string) {
    return `biz-dash:${prefix}:${businessId}${extra ? `:${extra}` : ""}`;
}

async function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
    try {
        const hit = await redis.get(key);
        if (hit) return JSON.parse(hit) as T;
    } catch {
        // redis down → fallback to DB
    }

    const data = await fn();

    redis.setex(key, ttl, JSON.stringify(data)).catch(() => { });
    return data;
}

export class BusinessDashboardService {
    /**
     * GET /dashboard/business/overview
     */
    static async getOverview(
        businessId: string,
        businessName: string,
        period: "week" | "month" | "year"
    ): Promise<BusinessOverviewResponse> {
        const key = cacheKey("overview", businessId, period);

        return cached(key, CACHE_TTL, async () => {
            const outletIds = await BusinessDashboardRepository.getOutletIds(businessId);

            const [
                aggregateSummary,
                productService,
                revenueSeries,
                paymentBreakdown,
                subscription,
                outletCount,
            ] = await Promise.all([
                BusinessDashboardRepository.getAggregateSummary(outletIds, period),
                BusinessDashboardRepository.countProductsAndServices(outletIds),
                BusinessDashboardRepository.getRevenueSeries(outletIds, period),
                BusinessDashboardRepository.getPaymentBreakdown(outletIds, period),
                BusinessDashboardRepository.getSubscriptionInfo(businessId),
                BusinessDashboardRepository.countOutlets(businessId),
            ]);

            const avgOrderValue =
                aggregateSummary.totalOrders > 0
                    ? aggregateSummary.totalRevenue / aggregateSummary.totalOrders
                    : 0;

            return {
                business: { id: businessId, name: businessName },
                summary: {
                    totalRevenue: aggregateSummary.totalRevenue,
                    totalOrders: aggregateSummary.totalOrders,
                    totalProducts: productService.products,
                    totalServices: productService.services,
                    outletCount,
                    avgOrderValue: Math.round(avgOrderValue),
                },
                revenueSeries,
                productService,
                paymentBreakdown,
                subscription,
            };
        });
    }

    /**
     * GET /dashboard/business/outlets
     */
    static async getOutlets(
        businessId: string,
        period: "week" | "month" | "year",
        top: number
    ): Promise<BusinessOutletsResponse> {
        const key = cacheKey("outlets", businessId, `${period}:${top}`);

        return cached(key, CACHE_TTL, async () => {
            const outletCount = await BusinessDashboardRepository.countOutlets(businessId);
            const outlets = await BusinessDashboardRepository.getOutletPerformance(
                businessId,
                period,
                top
            );

            return { outlets, total: outletCount };
        });
    }

    /**
     * GET /dashboard/business/recent-orders
     */
    static async getRecentOrders(
        businessId: string,
        limit: number
    ): Promise<BusinessRecentOrdersResponse> {
        const key = cacheKey("recent-orders", businessId, `${limit}`);

        return cached(key, 60, async () => {
            const outletIds = await BusinessDashboardRepository.getOutletIds(businessId);
            const orders = await BusinessDashboardRepository.getRecentOrders(outletIds, limit);
            return { orders };
        });
    }
}
