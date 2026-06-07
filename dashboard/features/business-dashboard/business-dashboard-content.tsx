"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    RefreshCw,
    Building2,
    TrendingUp,
    ShoppingBag,
    Wallet,
    Store,
    Clock,
    Sparkles,
    CalendarDays,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import {
    useBusinessOverview,
    useBusinessOutlets,
    useBusinessRecentOrders,
} from "@/hooks/use-business-dashboard";
import { RevenueTrendChart } from "./charts/revenue-trend-chart";
import { ProductServiceDonut } from "./charts/product-service-donut";
import { OutletPerformanceChart } from "./charts/outlet-performance-chart";
import { PaymentBreakdownDonut } from "./charts/payment-breakdown-donut";
import { LeaderboardTable } from "./leaderboard-table";
import { RecentOrdersTable } from "./recent-orders-table";
import { HighlightsCard } from "./highlights-card";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { EmptyDashboardState } from "./empty-dashboard-state";

const fmtNumber = (v: number) =>
    new Intl.NumberFormat("id-ID").format(Number.isFinite(v) ? v : 0);

type Period = "week" | "month" | "year";
const PERIOD_LABELS: Record<Period, string> = {
    week: "Minggu",
    month: "Bulan",
    year: "Tahun",
};

export default function BusinessDashboardContent() {
    const [period, setPeriod] = useState<Period>("month");

    const overview = useBusinessOverview(period);
    const outlets = useBusinessOutlets(period, 5);
    const recentOrders = useBusinessRecentOrders(10);

    const ov = overview.data;
    const ol = outlets.data;
    const ro = recentOrders.data;

    const isFetching =
        overview.isFetching || outlets.isFetching || recentOrders.isFetching;

    const refetchAll = () => {
        overview.refetch();
        outlets.refetch();
        recentOrders.refetch();
    };

    const kpis = useMemo(
        () => [
            {
                label: "Total Pendapatan",
                value: formatCurrency(ov?.summary.totalRevenue || 0),
                icon: Wallet,
                color: "text-green-600",
                description: "Total pendapatan kotor periode ini",
            },
            {
                label: "Total Pesanan",
                value: fmtNumber(ov?.summary.totalOrders || 0),
                icon: ShoppingBag,
                color: "text-blue-600",
                description: "Jumlah transaksi yang tercatat",
            },
            {
                label: "Rata-rata Pesanan",
                value: formatCurrency(ov?.summary.avgOrderValue || 0),
                icon: TrendingUp,
                color: "text-amber-600",
                description: "Nilai rata-rata per transaksi",
            },
            {
                label: "Outlet Aktif",
                value: fmtNumber(ov?.summary.outletCount || 0),
                icon: Store,
                color: "text-rose-600",
                description: "Outlet yang beroperasi",
            },
        ],
        [ov?.summary]
    );

    if (overview.isLoading) return <DashboardSkeleton />;

    if (!ov || !ov.summary.outletCount) return <EmptyDashboardState />;

    const topOutlets = ol?.outlets || [];
    const topPerformer = topOutlets[0];
    const avgOrdersPerOutlet = ov.summary.outletCount > 0 ? (ov.summary.totalOrders || 0) / ov.summary.outletCount : 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <header className="flex flex-col gap-3 rounded-md border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <Badge variant="outline" className="rounded-md border-dashed text-xs">
                        Business Overview
                    </Badge>
                    <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <h1 className="text-xl font-semibold leading-tight sm:text-2xl">
                            Dashboard Bisnis
                            {ov?.business.name ? ` · ${ov.business.name}` : ""}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex rounded-md border border-border/60 bg-muted/30 p-0.5">
                        {(["week", "month", "year"] as Period[]).map((p) => (
                            <Button
                                key={p}
                                variant={period === p ? "default" : "ghost"}
                                size="sm"
                                className="rounded-md px-3 text-xs"
                                onClick={() => setPeriod(p)}
                            >
                                {PERIOD_LABELS[p]}
                            </Button>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-md"
                        onClick={refetchAll}
                        disabled={isFetching}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </header>

            {ov?.subscription && (
                <Card className="rounded-md border-primary/20 bg-primary/5">
                    <CardContent className="flex flex-wrap items-center gap-3 p-4">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">
                            Paket <strong>{ov.subscription.plan}</strong> &middot;{" "}
                            {ov.subscription.status === "ACTIVE" ? (
                                <span className="text-green-600 dark:text-green-400">Aktif</span>
                            ) : (
                                <span className="text-red-600 dark:text-red-400">{ov.subscription.status}</span>
                            )}
                        </span>
                        {ov.subscription.daysLeft !== null && (
                            <Badge variant="secondary" className="rounded-md">
                                <CalendarDays className="mr-1 h-3.5 w-3.5" />
                                {ov.subscription.daysLeft} hari tersisa
                            </Badge>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {kpis.map((item) => (
                    <Card key={item.label} className="rounded-md border-border/60 shadow-sm hover:shadow-md transition-all group">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">
                                {item.label}
                            </CardTitle>
                            <div className={cn("p-1.5 rounded-md bg-muted group-hover:bg-primary/10 transition-colors", item.color)}>
                                <item.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight">{item.value}</div>
                            <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                                {item.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tier 1: Main Revenue Trend (Full Width) */}
            <div className="w-full">
                <RevenueTrendChart data={ov?.revenueSeries || []} period={period} />
            </div>

            {/* Tier 2: Distribution & Insights (3-Column Grid) */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <ProductServiceDonut
                    products={ov?.productService.products || 0}
                    services={ov?.productService.services || 0}
                />
                <PaymentBreakdownDonut data={ov?.paymentBreakdown || { online: 0, manual: 0 }} />
                <HighlightsCard
                    topOutlet={topPerformer ? { name: topPerformer.name, revenue: topPerformer.revenue } : undefined}
                    avgOrdersPerOutlet={avgOrdersPerOutlet}
                />
            </div>

            {/* Tier 3: Comparative Performance (Full Width) */}
            <div className="w-full">
                <OutletPerformanceChart outlets={topOutlets} />
            </div>

            <div className="space-y-6 pt-4">
                <div className="space-y-1">
                    <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                        Analisis Data Terperinci
                    </h3>
                    <p className="text-sm text-muted-foreground">Detail performa per outlet dan riwayat transaksi terbaru.</p>
                </div>
                <LeaderboardTable outlets={topOutlets} />
                <RecentOrdersTable orders={ro?.orders || []} />
            </div>
        </div>
    );
}
