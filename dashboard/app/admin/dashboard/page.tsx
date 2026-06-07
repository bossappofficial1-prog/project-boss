"use client";

import { RefreshCcw } from "lucide-react";

import { DashboardFilters } from "@/features/admin/dashboard/dashboard-filters";
import { KpiCards } from "@/features/admin/dashboard/kpi-cards";
import { RevenueTrend } from "@/features/admin/dashboard/revenue-trend";
import { SubscriptionFunnelCard } from "@/features/admin/dashboard/subscription-funnel-card";
import { ProofHealthDonut } from "@/features/admin/dashboard/proof-health-donut";
import { RiskyMerchantsTable } from "@/features/admin/dashboard/risky-merchants-table";
import { ActivityTimeline } from "@/features/admin/dashboard/activity-timeline";
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

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-6 lg:items-start">
                <div className="lg:col-span-3 lg:sticky lg:top-6 h-fit">
                    <SubscriptionFunnelCard
                        data={insightsQuery.data?.funnel}
                        isLoading={insightsQuery.isLoading}
                    />
                </div>
                <div className="space-y-6 lg:col-span-3">
                    <ActivityTimeline
                        data={activitiesQuery.data}
                        isLoading={activitiesQuery.isLoading}
                    />
                </div>
                <div className="lg:col-span-6">
                    <RiskyMerchantsTable
                        data={riskQuery.data}
                        isLoading={riskQuery.isLoading}
                    />
                </div>
            </section>
        </div>
    );
}
