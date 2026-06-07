'use client';

import { useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    BarChart3,
    DollarSign,
    LineChart as LineChartIcon,
    ShieldCheck,
    TrendingUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useRevenueAnalytics } from '@/hooks/use-revenue-analytics';
import type { RevenuePeriod, RevenueTrendPoint } from '@/hooks/use-revenue-analytics';

const PERIOD_OPTIONS: { label: string; value: RevenuePeriod; hint: string }[] = [
    { label: '30 Hari', value: 'daily', hint: 'Detail harian' },
    { label: '12 Minggu', value: 'weekly', hint: 'Momentum mingguan' },
    { label: '12 Bulan', value: 'monthly', hint: 'MRR view' },
];

const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value);
const formatPercent = (value: number) => `${value.toFixed(1)}%`;
const formatDateLabel = (value: string, period: RevenuePeriod) => {
    const date = new Date(value);
    if (period === 'daily') {
        return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(date);
    }
    if (period === 'weekly') {
        return `Minggu ${new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(date)}`;
    }
    return new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(date);
};

const chartGradient = (
    <defs>
        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.9} />
            <stop offset="95%" stopColor="#fb923c" stopOpacity={0.1} />
        </linearGradient>
        <linearGradient id="txnGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.6} />
            <stop offset="95%" stopColor="#7dd3fc" stopOpacity={0.1} />
        </linearGradient>
    </defs>
);

const RevenueTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const revenuePoint = payload.find((item: any) => item.dataKey === 'revenue');
    const txnPoint = payload.find((item: any) => item.dataKey === 'transactions');
    return (
        <div className="rounded-lg border bg-background/95 px-4 py-3 shadow-xl">
            <p className="text-sm font-semibold text-foreground">{revenuePoint?.payload?.label}</p>
            <p className="text-xs text-muted-foreground">{payload[0]?.payload?.period?.toUpperCase?.()}</p>
            <div className="mt-2 space-y-1 text-sm">
                <p className="flex items-center justify-between gap-4">
                    <span>Pendapatan</span>
                    <span className="font-semibold text-green-600">{formatCurrency(revenuePoint?.value || 0)}</span>
                </p>
                <p className="flex items-center justify-between gap-4">
                    <span>Transaksi</span>
                    <span className="font-medium">{formatNumber(txnPoint?.value || 0)}</span>
                </p>
            </div>
        </div>
    );
};

export default function RevenueAnalyticsPage() {
    const [period, setPeriod] = useState<RevenuePeriod>('monthly');
    const { trend, insights, isLoading, isRefetching, error, refetch } = useRevenueAnalytics(period);

    const chartData = useMemo(() => {
        return (trend?.chartData ?? []).map((point: RevenueTrendPoint) => ({
            ...point,
            label: formatDateLabel(point.date, point.period),
        }));
    }, [trend?.chartData]);

    const summary = insights?.summary;
    const feeBreakdown = insights?.feeBreakdown;
    const paymentMethods = insights?.paymentMethods ?? [];
    const subscriptionPlans = insights?.subscriptionPlans ?? [];
    const topBusinesses = insights?.topBusinesses ?? [];

    const statsCards = [
        {
            title: 'Revenue MTD',
            icon: DollarSign,
            value: formatCurrency(summary?.totalRevenue || 0),
            helper: `Net: ${formatCurrency(summary?.netRevenue || 0)}`,
        },
        {
            title: 'Average Order',
            icon: LineChartIcon,
            value: formatCurrency(summary?.averageOrderValue || 0),
            helper: `${formatNumber(summary?.totalTransactions || 0)} transaksi`,
        },
        {
            title: 'MRR (Paid Subs)',
            icon: BarChart3,
            value: formatCurrency(summary?.mrr || 0),
            helper: `ARR ${formatCurrency(summary?.arr || 0)}`,
        },
        {
            title: 'Growth vs Prev.',
            icon: TrendingUp,
            value: formatPercent(summary?.revenueGrowth || 0),
            helper: `Churn ${formatPercent(summary?.churnRate || 0)}`,
        },
    ];

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Gagal memuat analitik revenue</AlertTitle>
                <AlertDescription className="flex items-center justify-between gap-4">
                    <span>{(error as Error).message || 'Terjadi kesalahan pada server.'}</span>
                    <Button size="sm" variant="secondary" onClick={() => refetch()}>
                        Muat ulang
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-8">
            <section className="rounded-3xl bg-gradient-to-r from-rose-900 via-orange-700 to-amber-600 text-white p-8 shadow-2xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-4 max-w-3xl">
                        <p className="text-sm uppercase tracking-[0.4em] text-white/70">Revenue Command Center</p>
                        <h1 className="text-3xl lg:text-4xl font-semibold leading-tight">
                            Monitor MRR, fee platform, dan performa merchant besar secara real time.
                        </h1>
                        <p className="text-white/80">
                            Data disegarkan otomatis setiap menit dan difokuskan pada transaksi sukses dengan Midtrans dan pembayaran manual yang terverifikasi.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.3em] text-white/70">Rentang tren</p>
                        <div className="flex flex-wrap gap-2">
                            {PERIOD_OPTIONS.map((option) => (
                                <Button
                                    key={option.value}
                                    size="sm"
                                    variant={period === option.value ? 'default' : 'secondary'}
                                    className={period === option.value ? 'bg-white text-rose-900 hover:bg-white/90' : 'bg-white/15 text-white hover:bg-white/25'}
                                    onClick={() => setPeriod(option.value)}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                        <p className="text-xs text-white/70">{PERIOD_OPTIONS.find((opt) => opt.value === period)?.hint}</p>
                    </div>
                </div>
            </section>

            {isLoading ? (
                <AnalyticsSkeleton />
            ) : (
                <div className="space-y-8">
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {statsCards.map((card) => (
                            <Card key={card.title} className="border-slate-100 shadow-sm">
                                <CardHeader className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm text-muted-foreground">{card.title}</CardTitle>
                                        <card.icon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
                                    <p className="text-xs text-muted-foreground">{card.helper}</p>
                                </CardHeader>
                            </Card>
                        ))}
                    </section>

                    <section className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Revenue & Transactions</CardTitle>
                                    <p className="text-sm text-muted-foreground">Periode {trend?.summary.period.toUpperCase?.()}</p>
                                </div>
                                {isRefetching && <Badge variant="outline">Menyegarkan…</Badge>}
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 0 }}>
                                            {chartGradient}
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                            <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={16} style={{ fontSize: 12 }} />
                                            <YAxis yAxisId="left" tickFormatter={(value) => formatCurrency(value).replace('Rp', 'Rp ')} tickLine={false} axisLine={false} width={70} style={{ fontSize: 12 }} />
                                            <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatNumber(value)} tickLine={false} axisLine={false} width={40} style={{ fontSize: 12 }} />
                                            <Tooltip content={<RevenueTooltip />} />
                                            <Area type="monotone" yAxisId="left" dataKey="revenue" stroke="#f97316" fill="url(#revenueGradient)" strokeWidth={2} />
                                            <Area type="monotone" yAxisId="right" dataKey="transactions" stroke="#0ea5e9" fill="url(#txnGradient)" strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Fee Breakdown (Lifetime)</CardTitle>
                                <p className="text-sm text-muted-foreground">Midtrans + app fee vs net revenue</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg border bg-muted/40 p-4 space-y-1">
                                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Gross</p>
                                    <p className="text-2xl font-semibold text-slate-900">{formatCurrency(feeBreakdown?.grossRevenue || 0)}</p>
                                    <p className="text-sm text-muted-foreground">Net {formatCurrency(feeBreakdown?.netRevenue || 0)}</p>
                                </div>
                                <div className="space-y-3">
                                    <BreakdownRow label="App Fee (2%)" value={feeBreakdown?.appFees || 0} base={feeBreakdown?.grossRevenue || 0} />
                                    <BreakdownRow label="Payment Fee" value={feeBreakdown?.paymentFees || 0} base={feeBreakdown?.grossRevenue || 0} />
                                    <BreakdownRow label="Net Revenue" value={feeBreakdown?.netRevenue || 0} base={feeBreakdown?.grossRevenue || 0} accent />
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Metode Pembayaran</CardTitle>
                                <p className="text-sm text-muted-foreground">Dominasi channel selama lifetime transaksi</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {paymentMethods.length === 0 && (
                                    <p className="text-sm text-muted-foreground">Belum ada data transaksi sukses.</p>
                                )}
                                {paymentMethods.map((method) => (
                                    <div key={method.method} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm font-medium">
                                            <span>{method.method}</span>
                                            <span className="text-muted-foreground">{formatPercent(method.percentage)}</span>
                                        </div>
                                        <Progress value={method.percentage} className="h-2" />
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{method.transactionCount} transaksi</span>
                                            <span>{formatCurrency(method.totalAmount)}</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Distribusi Paket Langganan</CardTitle>
                                <p className="text-sm text-muted-foreground">Mengacu subscriptionPlan pada data Business</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {subscriptionPlans.length === 0 && (
                                    <p className="text-sm text-muted-foreground">Belum ada bisnis aktif.</p>
                                )}
                                {subscriptionPlans.map((plan) => (
                                    <div key={plan.plan} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm font-medium">
                                            <span>{plan.plan}</span>
                                            <span className="text-muted-foreground">{plan.businesses} bisnis</span>
                                        </div>
                                        <Progress value={plan.percentage} className="h-2" />
                                        <p className="text-xs text-muted-foreground">{formatPercent(plan.percentage)} dari total</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </section>

                    <section>
                        <Card>
                            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle>Top Performing Businesses</CardTitle>
                                    <p className="text-sm text-muted-foreground">Berdasarkan lifetime order sukses</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => refetch()}>
                                    Segarkan Data
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Bisnis</TableHead>
                                            <TableHead>Orders</TableHead>
                                            <TableHead className="text-right">Revenue</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topBusinesses.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                                                    Belum ada data order sukses.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {topBusinesses.map((biz) => (
                                            <TableRow key={biz.businessId}>
                                                <TableCell>
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">{biz.businessName}</p>
                                                        <p className="text-xs text-muted-foreground">ID {biz.businessId}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatNumber(biz.totalOrders)}</TableCell>
                                                <TableCell className="text-right font-semibold">{formatCurrency(biz.totalRevenue)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            )}
        </div>
    );
}

const BreakdownRow = ({ label, value, base, accent = false }: { label: string; value: number; base: number; accent?: boolean }) => {
    const percent = base > 0 ? (value / base) * 100 : 0;
    return (
        <div>
            <div className="flex items-center justify-between text-sm font-medium">
                <span className={accent ? 'text-slate-900' : ''}>{label}</span>
                <span className={accent ? 'text-slate-900' : 'text-muted-foreground'}>{formatCurrency(value)}</span>
            </div>
            <Progress value={percent} className={`h-2 ${accent ? 'bg-green-50' : ''}`} />
            <p className="text-xs text-muted-foreground mt-1">{formatPercent(percent)} dari gross</p>
        </div>
    );
};

const AnalyticsSkeleton = () => (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                    <CardContent className="space-y-3 pt-6">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-3 w-40" />
                    </CardContent>
                </Card>
            ))}
        </div>
        <Card>
            <CardContent className="p-6">
                <Skeleton className="h-80 w-full" />
            </CardContent>
        </Card>
        <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
                <Card key={index}>
                    <CardContent className="p-6 space-y-3">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
);
