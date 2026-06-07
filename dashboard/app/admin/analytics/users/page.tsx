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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    Clock,
    ShieldCheck,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useUserAnalytics, USER_ANALYTICS_SAMPLE } from '@/hooks/use-user-analytics';
import type { SignupTrendPoint } from '@/hooks/use-user-analytics';
import { RegistrationAnalytics } from '@/features/admin/analystics/registration-analystic';

type PeriodOption = {
    label: string;
    value: number;
    description: string;
};

const PERIOD_OPTIONS: PeriodOption[] = [
    { label: '7 Hari', value: 7, description: 'Momentum mingguan' },
    { label: '30 Hari', value: 30, description: 'Tren bulanan' },
    { label: '90 Hari', value: 90, description: 'Quarter view' },
];

const formatPercent = (value: number) => `${value.toFixed(1)}%`;
const formatNumber = (value: number) =>
    new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const formatDateLabel = (value: string) =>
    new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(new Date(value));

const chartGradient = (
    <defs>
        <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.9} />
            <stop offset="95%" stopColor="#fb923c" stopOpacity={0.1} />
        </linearGradient>
        <linearGradient id="verifiedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#4ade80" stopOpacity={0.1} />
        </linearGradient>
    </defs>
);

const SignupTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    const total = payload.find((item: any) => item.dataKey === 'total')?.value ?? 0;
    const verified = payload.find((item: any) => item.dataKey === 'verified')?.value ?? 0;

    return (
        <div className="rounded-lg border bg-background/95 px-4 py-3 shadow-xl">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold text-foreground mt-1">{total} pendaftar</p>
            <p className="text-xs text-muted-foreground">{verified} sudah terverifikasi</p>
        </div>
    );
};

export default function UserGrowthAnalyticsPage() {
    const [period, setPeriod] = useState<number>(30);
    const { analytics, isLoading, isRefetching, error, refetch } = useUserAnalytics(period);

    const chartData = useMemo(() => {
        return (analytics.signupTrend ?? []).map((point: SignupTrendPoint) => ({
            ...point,
            label: formatDateLabel(point.date),
        }));
    }, [analytics.signupTrend]);

    const roleInsights = analytics.roleDistribution.map((role) => ({
        ...role,
        percentLabel: formatPercent(role.percent),
    }));

    const verificationInsights = analytics.verificationDistribution.map((item) => ({
        ...item,
        percentLabel: formatPercent(item.percent),
    }));

    const providerInsights = analytics.providerDistribution.map((item) => ({
        ...item,
        percentLabel: formatPercent(item.percent),
    }));

    const statsCards = [
        {
            title: 'Total Pengguna',
            icon: Users,
            value: formatNumber(analytics.totalUsers),
            description: `Sampel ${SAMPLE_HINT}`,
            footer: `${analytics.totalUsers.toLocaleString('id-ID')} pengguna aktif di platform`,
        },
        {
            title: `Baru ${period} Hari`,
            icon: Clock,
            value: analytics.newUsers,
            description: `${analytics.avgDailySignups.toFixed(1)} user/hari rata-rata`,
            footer: analytics.startDate ? `${formatDateLabel(analytics.startDate)} - ${formatDateLabel(analytics.endDate)}` : '',
        },
        {
            title: 'Verification Rate',
            icon: ShieldCheck,
            value: formatPercent(analytics.verificationRate),
            description: `${analytics.verificationDistribution[0]?.value || 0} user verified`,
            footer: 'Dari seluruh pendaftar periode ini',
        },
        {
            title: 'Growth vs Periode Lalu',
            icon: TrendingUp,
            value: formatPercent(analytics.growthRate),
            description: 'Dibanding periode sebelumnya',
            footer: analytics.growthRate >= 0 ? 'Momentum positif' : 'Perlu aktivasi tambahan',
        },
    ];

    const recentUsers = analytics.recentUsers;

    if (error) {
        return (
            <div className="space-y-4">
                <Alert variant="destructive">
                    <AlertTitle>Gagal memuat data</AlertTitle>
                    <AlertDescription className="flex items-center justify-between gap-4">
                        <span>{(error as Error).message || 'Terjadi kesalahan.'}</span>
                        <Button variant="secondary" size="sm" onClick={() => refetch()}>
                            Coba lagi
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-8 shadow-2xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-2xl space-y-3">
                        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Platform Analytics</p>
                        <h1 className="text-3xl font-semibold leading-tight lg:text-4xl">
                            Pertumbuhan Pengguna & Aktivasi Merchant
                        </h1>
                        <p className="text-slate-300">
                            Pantau efisiensi funnel registrasi, tingkat verifikasi, dan distribusi role untuk memastikan kualitas tenant yang masuk.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Rentang Analitik</p>
                        <div className="flex flex-wrap gap-2">
                            {PERIOD_OPTIONS.map((option) => (
                                <Button
                                    key={option.value}
                                    size="sm"
                                    variant={option.value === period ? 'default' : 'secondary'}
                                    className={option.value === period ? 'bg-white text-slate-900 hover:bg-white/90' : 'bg-white/10 text-white hover:bg-white/20'}
                                    onClick={() => setPeriod(option.value)}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>
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
                                    <p className="text-xs text-muted-foreground">{card.description}</p>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs font-medium text-slate-500">{card.footer}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </section>

                    <RegistrationAnalytics
                        chartData={chartData}
                        isRefetching={isRefetching}
                        providerInsights={providerInsights}
                        roleInsights={roleInsights}
                        sampleHint={SAMPLE_HINT}
                        verificationInsights={verificationInsights}
                    />

                    <section className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Ringkasan Aktivasi</CardTitle>
                                    <p className="text-sm text-muted-foreground">Snapshot funnel pengguna baru</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => refetch()}>
                                    Perbarui Data
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Verification gap</p>
                                    <p className="text-2xl font-semibold text-slate-900">
                                        {analytics.verificationDistribution[0]?.value || 0} / {analytics.newUsers}
                                    </p>
                                    <p className="text-sm text-muted-foreground">User sudah submit bukti & terverifikasi</p>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <InsightCard
                                        title="Owner Dominance"
                                        value={roleInsights.find((role) => role.label === 'Owners')?.percentLabel ?? '0%'}
                                        description="Proporsi pemilik UMKM"
                                    />
                                    <InsightCard
                                        title="Google Sign-in"
                                        value={providerInsights.find((item) => item.label === 'Google OAuth')?.percentLabel ?? '0%'}
                                        description="Adopsi login sekali klik"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Pendaftar Terbaru</CardTitle>
                                <p className="text-sm text-muted-foreground">Monitoring manual review & onboarding</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-xl border p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Pengguna</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Tanggal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentUsers.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                                                        Belum ada pendaftar pada periode ini.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {recentUsers.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarFallback>
                                                                    {user.name?.slice(0, 2).toUpperCase() || 'US'}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="text-sm font-medium text-foreground">{user.name}</p>
                                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{user.role}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                                                            {user.isVerified ? 'Verified' : 'Pending'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs text-muted-foreground">
                                                        {formatDateLabel(user.createdAt)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            )}
        </div>
    );
}

const SAMPLE_HINT = `${USER_ANALYTICS_SAMPLE} user terbaru`;

const InsightCard = ({ title, value, description }: { title: string; value: string; description: string }) => (
    <div className="rounded-2xl border bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{title}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
    </div>
);

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
                <Skeleton className="h-64 w-full" />
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
