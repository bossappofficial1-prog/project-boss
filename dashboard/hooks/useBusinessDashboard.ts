"use client";

import { useQuery } from "@tanstack/react-query";
import { businessDashboardApi } from "@/lib/apis/business-dashboard";
import type {
    BusinessOverviewData,
    BusinessOutletsData,
    BusinessRecentOrdersData,
} from "@/lib/apis/business-dashboard";

type Period = "week" | "month" | "year";

/**
 * Hook 1 — Overview (summary + revenue series + pie + subscription)
 */
export function useBusinessOverview(period: Period = "month") {
    return useQuery<BusinessOverviewData>({
        queryKey: ["business-dashboard", "overview", period],
        queryFn: () => businessDashboardApi.getOverview(period),
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Hook 2 — Outlet performance / leaderboard
 */
export function useBusinessOutlets(period: Period = "month", top: number = 5) {
    return useQuery<BusinessOutletsData>({
        queryKey: ["business-dashboard", "outlets", period, top],
        queryFn: () => businessDashboardApi.getOutlets(period, top),
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Hook 3 — Recent orders across all outlets
 */
export function useBusinessRecentOrders(limit: number = 10) {
    return useQuery<BusinessRecentOrdersData>({
        queryKey: ["business-dashboard", "recent-orders", limit],
        queryFn: () => businessDashboardApi.getRecentOrders(limit),
        staleTime: 60 * 1000,
    });
}

