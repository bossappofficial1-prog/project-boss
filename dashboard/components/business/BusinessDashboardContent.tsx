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
import {
    useBusinessOverview,
    useBusinessOutlets,
    useBusinessRecentOrders,
} from "@/hooks/useBusinessDashboard";
import { RevenueTrendChart } from "@/components/business/charts/RevenueTrendChart";
import { ProductServiceDonut } from "@/components/business/charts/ProductServiceDonut";
import { OutletPerformanceChart } from "@/components/business/charts/OutletPerformanceChart";
import { PaymentBreakdownDonut } from "@/components/business/charts/PaymentBreakdownDonut";

const ORDER_STATUS_LABEL: Record<string, string> = {
    AWAITING_PAYMENT: "Menunggu Bayar",
    PROCESSING: "Diproses",
    CONFIRMED: "Dikonfirmasi",
    READY: "Siap",
    ON_GOING: "Berjalan",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; className: string }> = {
    SUCCESS: { label: "Sukses", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    FAILED: { label: "Gagal", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    EXPIRED: { label: "Expired", className: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400" },
    CANCELLED: { label: "Batal", className: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400" },
};

const fmtCurrency = (v: number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number.isFinite(v) ? v : 0);

const fmtNumber = (v: number) =>
    new Intl.NumberFormat("id-ID").format(Number.isFinite(v) ? v : 0);

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    });

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
    const isLoading = overview.isLoading;
    const error = overview.error || outlets.error || recentOrders.error;

    const refetchAll = () => {
        overview.refetch();
        outlets.refetch();
        recentOrders.refetch();
    };

    const kpis = useMemo(
        () => [
            {
                label: "Total Pendapatan",
                value: fmtCurrency(ov?.summary.totalRevenue || 0),
                icon: Wallet,
                accent: "text-green-600 bg-green-500/10 dark:text-green-400",
            },
            {
                label: "Total Pesanan",
                value: fmtNumber(ov?.summary.totalOrders || 0),
                icon: ShoppingBag,
                accent: "text-blue-600 bg-blue-500/10 dark:text-blue-400",
            },
            {
                label: "Rata-rata Pesanan",
                value: fmtCurrency(ov?.summary.avgOrderValue || 0),
                icon: TrendingUp,
                accent: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
            },
            {
                label: "Outlet Aktif",
                value: fmtNumber(ov?.summary.outletCount || 0),
                icon: Store,
                accent: "text-rose-600 bg-rose-500/10 dark:text-rose-400",
            },
        ],
        [ov?.summary]
    );

    const topOutlets = ol?.outlets || [];
    const isEmpty = !isLoading && !ov?.summary.outletCount;

    return (
        <div className="space-y-3">
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
                    <p className="text-sm text-muted-foreground">
                        Ringkasan kinerja lintas outlet, pesanan, dan pendapatan.
                    </p>
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

            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
                    {(error as Error).message}
                </div>
            )}

            {isLoading ? (
                <LoadingSkeleton />
            ) : isEmpty ? (
                <EmptyState />
            ) : (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {kpis.map((item) => (
                            <Card key={item.label} className="rounded-md border-border/60 shadow-sm">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md ${item.accent}`}>
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                        <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                                        <p className="text-xl font-bold leading-tight tabular-nums sm:text-2xl">{item.value}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                        <RevenueTrendChart data={ov?.revenueSeries || []} period={period} />
                        <ProductServiceDonut
                            products={ov?.productService.products || 0}
                            services={ov?.productService.services || 0}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                        <OutletPerformanceChart outlets={topOutlets} />
                        <div className="flex flex-col gap-3">
                            <PaymentBreakdownDonut data={ov?.paymentBreakdown || { online: 0, manual: 0 }} />
                            <HighlightsCard
                                topOutlet={topOutlets[0]}
                                avgOrdersPerOutlet={
                                    ov?.summary.outletCount
                                        ? Math.round((ov.summary.totalOrders || 0) / ov.summary.outletCount)
                                        : 0
                                }
                            />
                        </div>
                    </div>

                    <LeaderboardTable outlets={topOutlets} />

                    <RecentOrdersTable orders={ro?.orders || []} />
                </div>
            )}
        </div>
    );
}

function HighlightsCard({
    topOutlet,
    avgOrdersPerOutlet,
}: {
    topOutlet?: { name: string; revenue: number };
    avgOrdersPerOutlet: number;
}) {
    return (
        <Card className="rounded-md flex-1 border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-3">
                <CardTitle className="text-base">Sorotan Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
                <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Top outlet</p>
                    <p className="text-base font-semibold text-foreground">
                        {topOutlet?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {topOutlet ? fmtCurrency(topOutlet.revenue) : "Belum ada data"}
                    </p>
                </div>
                <Separator />
                <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Rata-rata pesanan / outlet</p>
                    <p className="text-base font-semibold text-foreground tabular-nums">
                        {fmtNumber(avgOrdersPerOutlet)}
                    </p>
                    <p className="text-xs text-muted-foreground">Pesanan dibagi jumlah outlet</p>
                </div>
            </CardContent>
        </Card>
    );
}

function LeaderboardTable({
    outlets,
}: {
    outlets: Array<{ id: string; name: string; revenue: number; orders: number; products: number; services: number }>;
}) {
    return (
        <Card className="rounded-md border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-3">
                <CardTitle className="text-lg">Leaderboard Outlet</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Top outlet berdasarkan pendapatan.
                </p>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                    <thead>
                        <tr className="border-b border-border/40 bg-muted/10">
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Outlet</th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Pendapatan</th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Pesanan</th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Produk</th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Layanan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {outlets.length ? (
                            outlets.map((outlet, idx) => (
                                <tr key={outlet.id} className="transition-colors hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-bold">
                                            {idx + 1}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-foreground">{outlet.name}</p>
                                            <p className="text-xs text-muted-foreground">{outlet.orders} pesanan</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                                        {fmtCurrency(outlet.revenue)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                                        {fmtNumber(outlet.orders)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                                        {fmtNumber(outlet.products)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                                        {fmtNumber(outlet.services)}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                    Belum ada data outlet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
}

function RecentOrdersTable({
    orders,
}: {
    orders: Array<{
        id: string;
        outletName: string;
        amount: number;
        createdAt: string;
        paymentStatus: string;
        orderStatus: string;
        customerName: string;
    }>;
}) {
    return (
        <Card className="rounded-md border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-primary" />
                    Pesanan Terbaru
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    10 pesanan terakhir dari semua outlet.
                </p>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                    <thead>
                        <tr className="border-b border-border/40 bg-muted/10">
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Outlet</th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Jumlah</th>
                            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Pembayaran</th>
                            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Waktu</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {orders.length ? (
                            orders.map((order) => {
                                const payStatus = PAYMENT_STATUS_MAP[order.paymentStatus] || {
                                    label: order.paymentStatus,
                                    className: "bg-gray-100 text-gray-600",
                                };
                                return (
                                    <tr key={order.id} className="transition-colors hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-foreground truncate block max-w-[160px]">
                                                {order.customerName}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground truncate max-w-[140px]">
                                            {order.outletName}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                                            {fmtCurrency(order.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge
                                                variant="secondary"
                                                className={`rounded-md text-xs font-medium ${payStatus.className}`}
                                            >
                                                {payStatus.label}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge variant="outline" className="rounded-md text-xs">
                                                {ORDER_STATUS_LABEL[order.orderStatus] || order.orderStatus}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="text-xs text-muted-foreground">
                                                <span>{fmtDate(order.createdAt)}</span>
                                                <span className="ml-1 opacity-60">{fmtTime(order.createdAt)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                    Belum ada pesanan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-24 w-full rounded-md" />
                ))}
            </div>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                <Skeleton className="h-[400px] rounded-md xl:col-span-2" />
                <Skeleton className="h-[400px] rounded-md" />
            </div>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                <Skeleton className="h-[400px] rounded-md xl:col-span-2" />
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-[190px] rounded-md" />
                    <Skeleton className="h-[190px] rounded-md" />
                </div>
            </div>
            <Skeleton className="h-[320px] rounded-md" />
            <Skeleton className="h-[320px] rounded-md" />
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Building2 className="h-7 w-7" />
            </div>
            <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">Belum ada outlet</p>
                <p className="text-sm text-muted-foreground">
                    Tambahkan outlet untuk mulai melihat ringkasan bisnis.
                </p>
            </div>
        </div>
    );
}
