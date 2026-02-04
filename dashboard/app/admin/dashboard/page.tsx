"use client";

import { RefreshCcw } from "lucide-react";

import { DashboardFilters } from "@/components/admin/dashboard/DashboardFilters";
import { KpiCards } from "@/components/admin/dashboard/KpiCards";
import { RevenueTrend } from "@/components/admin/dashboard/RevenueTrend";
import { SubscriptionFunnelCard } from "@/components/admin/dashboard/SubscriptionFunnelCard";
import { ProofHealthDonut } from "@/components/admin/dashboard/ProofHealthDonut";
import { RiskyMerchantsTable } from "@/components/admin/dashboard/RiskyMerchantsTable";
import { ActivityTimeline } from "@/components/admin/dashboard/ActivityTimeline";
import { Button } from "@/components/ui/button";
import {
    useAdminDashboardActivities,
    useAdminDashboardInsights,
    useAdminDashboardRisk,
    useDashboardFilters,
} from "@/hooks/api/use-admin-dashboard";

export default function AdminDashboardPage() {
    const { dateRange, setDateRange, interval, setInterval, resolvedRange } = useDashboardFilters();
    const insightsQuery = useAdminDashboardInsights({ range: resolvedRange, interval });
    const riskQuery = useAdminDashboardRisk(6);
    const activitiesQuery = useAdminDashboardActivities(8);

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-border/60 bg-background p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">Command Center</p>
                        <h1 className="mt-2 text-3xl font-semibold leading-tight">Dashboard Platform Admin</h1>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                            Monitor pendapatan SaaS, status bukti pembayaran, dan risiko merchant dalam satu layar taktikal.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="gap-2 rounded-full border border-border/80"
                        onClick={() => insightsQuery.refetch()}
                        disabled={insightsQuery.isFetching}
                    >
                        <RefreshCcw className={`h-4 w-4 ${insightsQuery.isFetching ? "animate-spin" : ""}`} />
                        Refresh data
                    </Button>
                </div>
            </section>

            <DashboardFilters
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                interval={interval}
                onIntervalChange={setInterval}
            />

            <KpiCards snapshot={insightsQuery.data?.snapshot} isLoading={insightsQuery.isLoading} />

            <section className="grid gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <RevenueTrend
                        data={insightsQuery.data?.revenueTrend}
                        interval={interval}
                        isLoading={insightsQuery.isLoading}
                    />
                </div>
                <ProofHealthDonut data={insightsQuery.data?.proofHealth} isLoading={insightsQuery.isLoading} />
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
                <SubscriptionFunnelCard data={insightsQuery.data?.funnel} isLoading={insightsQuery.isLoading} />
                <div className="space-y-6 xl:col-span-2">
                    <RiskyMerchantsTable data={riskQuery.data} isLoading={riskQuery.isLoading} />
                    <ActivityTimeline data={activitiesQuery.data} isLoading={activitiesQuery.isLoading} />
                </div>
            </section>
        </div>
    );
}
