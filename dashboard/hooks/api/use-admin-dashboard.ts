"use client";

import { useMemo, useState } from "react";
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { useQuery } from "@tanstack/react-query";
import {
    adminDashboardApi,
    type AdminDashboardActivityRecord,
    type AdminDashboardInsightsParams,
    type AdminDashboardInsightsResponse,
    type AdminDashboardInterval,
    type AdminDashboardRiskRecord,
} from "@/lib/apis/admin-dashboard";

interface ResolvedRange {
    from: Date;
    to: Date;
}

const DEFAULT_DATE_RANGE: DateRange = {
    from: addDays(new Date(), -29),
    to: new Date(),
};

const DEFAULT_RESOLVED: ResolvedRange = {
    from: DEFAULT_DATE_RANGE.from!,
    to: DEFAULT_DATE_RANGE.to!,
};

export function useDashboardFilters() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>(DEFAULT_DATE_RANGE);
    const [interval, setInterval] = useState<AdminDashboardInterval>("day");

    const resolvedRange = useMemo<ResolvedRange>(() => {
        const from = dateRange?.from ?? DEFAULT_RESOLVED.from;
        const to = dateRange?.to ?? dateRange?.from ?? DEFAULT_RESOLVED.to;

        if (from > to) {
            return { from: to, to: from };
        }

        return { from, to };
    }, [dateRange]);

    return {
        dateRange,
        setDateRange,
        interval,
        setInterval,
        resolvedRange,
    };
}

export function useAdminDashboardInsights(params: { range: ResolvedRange; interval: AdminDashboardInterval }) {
    const payload: AdminDashboardInsightsParams = {
        startDate: params.range.from.toISOString(),
        endDate: params.range.to.toISOString(),
        interval: params.interval,
    };

    return useQuery<AdminDashboardInsightsResponse>({
        queryKey: ["admin-dashboard-insights", payload.interval, payload.startDate, payload.endDate],
        queryFn: () => adminDashboardApi.getInsights(payload),
        staleTime: 60_000,
    });
}

export function useAdminDashboardRisk(limit: number = 8) {
    return useQuery<AdminDashboardRiskRecord[]>({
        queryKey: ["admin-dashboard-risk", limit],
        queryFn: () => adminDashboardApi.getRiskyMerchants(limit),
        staleTime: 60_000,
    });
}

export function useAdminDashboardActivities(limit: number = 12) {
    return useQuery<AdminDashboardActivityRecord[]>({
        queryKey: ["admin-dashboard-activities", limit],
        queryFn: () => adminDashboardApi.getRecentActivities(limit),
        staleTime: 30_000,
    });
}