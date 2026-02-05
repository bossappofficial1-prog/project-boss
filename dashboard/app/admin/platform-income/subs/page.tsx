'use client';

import { useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
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
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    BellRing,
    DollarSign,
    RefreshCw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useSubscriptionIncome } from '@/hooks/useSubscriptionIncome';
import type { SubscriptionIncomeTrendPoint, SubscriptionUpcomingRenewal, SubscriptionRecentInvoice } from '@/hooks/useSubscriptionIncome';

const PERIOD_OPTIONS = [
    { label: '6 Bulan', value: 6 },
    { label: '12 Bulan', value: 12 },
    { label: '18 Bulan', value: 18 },
];

const formatPercent = (value: number) => {
    const formatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });
    const formatted = formatter.format(Math.abs(value));
    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    return `${sign}${formatted}%`;
};

const formatMonthLabel = (isoDate: string) => {
    return new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(new Date(isoDate));
};

const trendGradient = (
    <defs>
        <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.9} />
            <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.05} />
        </linearGradient>
    </defs>
);

const PLAN_COLORS = ['#f97316', '#6366f1', '#10b981', '#ef4444', '#14b8a6', '#a855f7'];

const statusVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
        case 'SUCCESS':
            return 'default';
        case 'PENDING':
        case 'AWAITING_VERIFICATION':
        case 'PROOF_SUBMITTED':
            return 'secondary';
        case 'FAILED':
        case 'CANCELLED':
        case 'EXPIRED':
            return 'destructive';
        default:
            return 'outline';
    }
};

const invoiceStatusColor = (status: string) => {
    switch (status) {
        case 'SUCCESS':
            return 'bg-emerald-500';
        case 'PENDING':
        case 'AWAITING_VERIFICATION':
        case 'PROOF_SUBMITTED':
            return 'bg-amber-500';
        case 'FAILED':
        case 'CANCELLED':
        case 'EXPIRED':
            return 'bg-rose-500';
        default:
            return 'bg-slate-400';
    }
};

const TrendTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const [point] = payload;
    if (!point?.payload) return null;

    return (
        <div className="rounded-xl border bg-background/95 px-4 py-3 shadow-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">MRR</p>
            <p className="text-sm font-semibold text-foreground">{formatMonthLabel(point.payload.date)}</p>
            <p className="text-2xl font-bold text-primary mt-2">{formatCurrency(point.payload.revenue)}</p>
            <p className="text-xs text-muted-foreground">{point.payload.invoices} invoice</p>
        </div>
    );
};

export default function SubscriptionRevenuePage() {
    const [months, setMonths] = useState<number>(12);
    const { data, isLoading, isError, error, isRefetching, refetch } = useSubscriptionIncome(months);

    const chartData = useMemo(() => {
        return (data?.revenueTrend.points ?? []).map((point: SubscriptionIncomeTrendPoint) => ({
            ...point,
            label: formatMonthLabel(point.date),
        }));
    }, [data?.revenueTrend.points]);

    const planDistribution = useMemo(() => {
        const plans = data?.planDistribution ?? [];
        const sorted = [...plans].sort((a, b) => b.businesses - a.businesses).slice(0, PLAN_COLORS.length);
        return sorted;
    }, [data?.planDistribution]);

    const invoiceStatuses = data?.invoiceStatus ?? [];
    const totalInvoices = invoiceStatuses.reduce((sum, status) => sum + status.invoices, 0);

    if (isError) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Gagal memuat data pendapatan langganan</AlertTitle>
                <AlertDescription className="flex items-center justify-between gap-3">
                    <span>{(error as Error)?.message ?? 'Silakan coba beberapa saat lagi.'}</span>
                    <Button size="sm" variant="secondary" onClick={() => refetch()}>
                        Coba Lagi
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-8">
            <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 text-white p-8 shadow-2xl border border-white/10">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-4 max-w-3xl">
                        <p className="text-xs uppercase tracking-[0.4em] text-blue-200">Platform Income</p>
                        <h1 className="text-3xl lg:text-4xl font-semibold leading-tight">
                            Subscription Revenue Command Center
                        </h1>
                        <p className="text-white/80">
                            Pantau MRR, ARR, kesehatan invoice, dan renewal pipeline tanpa harus membuka spreadsheet terpisah.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.3em] text-white/70">Horizon Tren</p>
                        <div className="flex flex-wrap gap-2">
                            {PERIOD_OPTIONS.map((option) => (
                                <Button
                                    key={option.value}
                                    size="sm"
                                    variant={months === option.value ? 'default' : 'secondary'}
                                    className={months === option.value ? 'bg-white text-slate-900 hover:bg-white/90' : 'bg-white/20 text-white hover:bg-white/30'}
                                    onClick={() => setMonths(option.value)}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                        {isRefetching && <Badge variant="outline" className="border-white/40 text-white">Menyegarkan…</Badge>}
                    </div>
                </div>
            </section>

            {isLoading || !data ? (
                <AnalyticsSkeleton />
            ) : (
                <div className="space-y-8">
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            icon={DollarSign}
                            title="Monthly Recurring Revenue"
                            value={formatCurrency(data.summary.mrr)}
                            helper={`${formatPercent(data.summary.mrrGrowth)} vs bulan lalu`}
                        />
                        <SummaryCard
                            icon={BarChart3}
                            title="Annual Recurring Revenue"
                            value={formatCurrency(data.summary.arr)}
                            helper={`ARPA ${formatCurrency(data.summary.averageContractValue)}`}
                        />
                        <SummaryCard
                            icon={BellRing}
                            title="Active Subscriptions"
                            value={data.summary.activeSubscriptions.toLocaleString('id-ID')}
                            helper={`${data.summary.expiringSoon} akan berakhir 30 hari lagi`}
                        />
                        <SummaryCard
                            icon={AlertTriangle}
                            title="Overdue Invoices"
                            value={`${data.summary.overdueInvoices} invoice`}
                            helper={`Nilai ${formatCurrency(data.summary.overdueAmount)}`}
                            variant="warning"
                        />
                    </section>

                    <section className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>MRR Trend</CardTitle>
                                    <p className="text-sm text-muted-foreground">{months} bulan terakhir</p>
                                </div>
                                <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
                                    <RefreshCw className="h-4 w-4" /> Segarkan
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ left: 12, right: 12, top: 10, bottom: 0 }}>
                                            {trendGradient}
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                            <XAxis dataKey="label" tickLine={false} axisLine={false} style={{ fontSize: 12 }} />
                                            <YAxis tickFormatter={(value) => formatCurrency(value)} tickLine={false} axisLine={false} width={80} style={{ fontSize: 12 }} />
                                            <Tooltip content={<TrendTooltip />} />
                                            <Area type="monotone" dataKey="revenue" stroke="#60a5fa" strokeWidth={2} fill="url(#mrrGradient)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Plan Distribution</CardTitle>
                                <p className="text-sm text-muted-foreground">Kontribusi MRR dan tenant aktif</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {planDistribution.length === 0 && (
                                    <p className="text-sm text-muted-foreground">Belum ada tenant aktif.</p>
                                )}
                                {planDistribution.length > 0 && (
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={planDistribution} layout="vertical" margin={{ left: 20, right: 12 }}>
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                                <XAxis type="number" hide />
                                                <YAxis type="category" dataKey="planName" width={90} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    formatter={(value: number, _name: string, props: any) => [formatCurrency(value as number), props.payload.planName]}
                                                />
                                                <Bar dataKey="mrrContribution" radius={[0, 12, 12, 0]}>
                                                    {planDistribution.map((entry, index) => (
                                                        <Cell key={entry.planCode} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                                <div className="space-y-3">
                                    {planDistribution.map((plan, index) => (
                                        <div key={plan.planCode} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="h-2.5 w-2.5 rounded-full"
                                                        style={{ backgroundColor: PLAN_COLORS[index % PLAN_COLORS.length] }}
                                                    />
                                                    <span>{plan.planName}</span>
                                                </div>
                                                <span className="text-muted-foreground">{plan.businesses} bisnis</span>
                                            </div>
                                            <Progress value={plan.percentage} />
                                            <p className="text-xs text-muted-foreground">{formatCurrency(plan.mrrContribution)} MRR</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Invoice Health</CardTitle>
                                <p className="text-sm text-muted-foreground">Status distribusi invoice terkini</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {invoiceStatuses.length === 0 && <p className="text-sm text-muted-foreground">Belum ada invoice.</p>}
                                {invoiceStatuses.map((status) => (
                                    <div key={status.status} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <span className={`h-2 w-2 rounded-full ${invoiceStatusColor(status.status)}`} />
                                                <span>{status.status.replace(/_/g, ' ')}</span>
                                            </div>
                                            <span className="text-muted-foreground">{status.invoices} invoice</span>
                                        </div>
                                        <Progress value={totalInvoices > 0 ? (status.invoices / totalInvoices) * 100 : 0} />
                                        <p className="text-xs text-muted-foreground">{formatCurrency(status.amount)}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Upcoming Renewals</CardTitle>
                                    <p className="text-sm text-muted-foreground">30 hari ke depan</p>
                                </div>
                                <Badge variant="outline">{data.summary.expiringSoon} pipeline</Badge>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.upcomingRenewals.length === 0 && (
                                    <p className="text-sm text-muted-foreground">Tidak ada renewals dalam 30 hari.</p>
                                )}
                                {data.upcomingRenewals.length > 0 && (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tenant</TableHead>
                                                <TableHead>Plan</TableHead>
                                                <TableHead className="text-right">Jatuh Tempo</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.upcomingRenewals.map((renewal: SubscriptionUpcomingRenewal) => (
                                                <TableRow key={renewal.subscriptionId}>
                                                    <TableCell>
                                                        <p className="text-sm font-semibold text-foreground">{renewal.businessName}</p>
                                                        <p className="text-xs text-muted-foreground">{renewal.daysRemaining} hari lagi</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{renewal.planName}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm text-muted-foreground">
                                                        {new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(new Date(renewal.endsAt))}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Recent Invoices</CardTitle>
                                    <p className="text-sm text-muted-foreground">8 invoice terakhir</p>
                                </div>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Invoice</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Jumlah</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.recentInvoices.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                                                    Belum ada histori invoice.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {data.recentInvoices.map((invoice: SubscriptionRecentInvoice) => (
                                            <TableRow key={invoice.id}>
                                                <TableCell>
                                                    <p className="text-sm font-semibold text-foreground">{invoice.invoiceNumber}</p>
                                                    <p className="text-xs text-muted-foreground">{invoice.businessName}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={statusVariant(invoice.status)}>{invoice.status.replace(/_/g, ' ')}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-sm font-medium">{formatCurrency(invoice.amount)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <InsightsPanel summary={data.summary} />
                    </section>
                </div>
            )}
        </div>
    );
}

function SummaryCard({
    icon: Icon,
    title,
    value,
    helper,
    variant = 'default',
}: {
    icon: LucideIcon;
    title: string;
    value: string;
    helper: string;
    variant?: 'default' | 'warning';
}) {
    return (
        <Card className={variant === 'warning' ? 'bg-amber-50 border-amber-100' : undefined}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-foreground">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{helper}</p>
            </CardContent>
        </Card>
    );
}

const AnalyticsSkeleton = () => (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
                <Card key={idx}>
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
            {Array.from({ length: 2 }).map((_, idx) => (
                <Card key={idx}>
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

function InsightsPanel({ summary }: { summary: { mrr: number; arr: number; averageContractValue: number; overdueAmount: number; overdueInvoices: number; } }) {
    return (
        <Card className="bg-gradient-to-b from-slate-900 to-slate-800 text-white">
            <CardHeader>
                <CardTitle>Strategic Insights</CardTitle>
                <p className="text-sm text-white/70">Snapshot singkat untuk bahan sync mingguan.</p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">Runway</p>
                    <p className="text-3xl font-semibold">{formatCurrency(summary.arr)}</p>
                    <p className="text-sm text-white/70">ARR saat ini dengan asumsi retensi stabil.</p>
                </div>
                <div className="space-y-4">
                    <InsightRow label="Average Contract Value" value={formatCurrency(summary.averageContractValue)} />
                    <InsightRow label="Outstanding Liability" value={formatCurrency(summary.overdueAmount)} />
                    <InsightRow label="Invoices To Chase" value={`${summary.overdueInvoices} invoice`} />
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">Action</p>
                    <p className="text-sm text-white/80">Prioritaskan follow-up manual untuk invoice overdue sebelum akhir minggu untuk menjaga arus kas.</p>
                </div>
            </CardContent>
        </Card>
    );
}

const InsightRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="font-semibold">{value}</span>
    </div>
);
