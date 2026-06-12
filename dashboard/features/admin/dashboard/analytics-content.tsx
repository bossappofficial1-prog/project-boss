'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDashboardAnalytics, useClearAnalyticsCache, DashboardAnalytics } from '@/lib/apis/admin-analytics';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Building2, RefreshCw, ArrowUpRight, ArrowDownRight, Percent, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, trendValue }: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {trendValue && (
          <div className="flex items-center gap-1 mt-2">
            {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
            {trend === 'down' && <ArrowDownRight className="h-3 w-3 text-red-500" />}
            <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground'}`}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function DashboardAnalyticsContent() {
  const { data: analytics, isLoading, refetch, isRefetching } = useDashboardAnalytics();
  const clearCacheMutation = useClearAnalyticsCache();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Metrik lengkap platform</p>
          </div>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { snapshot, churnRate, ltv, cohortRetention, mrrGrowth, arpu, netRevenueRetention } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Metrik lengkap platform BOSS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearCacheMutation.mutate()}
            disabled={clearCacheMutation.isPending}
          >
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Snapshot Metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Bisnis"
          value={formatNumber(snapshot.totalBusinesses)}
          subtitle={`${snapshot.activeBusinesses} aktif`}
          icon={Building2}
        />
        <MetricCard
          title="Total Users"
          value={formatNumber(snapshot.totalUsers)}
          icon={Users}
        />
        <MetricCard
          title="MRR"
          value={formatCurrency(mrrGrowth.current)}
          icon={DollarSign}
          trend={mrrGrowth.growthRate >= 0 ? 'up' : 'down'}
          trendValue={`${mrrGrowth.growthRate >= 0 ? '+' : ''}${mrrGrowth.growthRate}% dari bulan lalu`}
        />
        <MetricCard
          title="ARR"
          value={formatCurrency(snapshot.arr)}
          subtitle="Annual Recurring Revenue"
          icon={TrendingUp}
        />
      </div>

      {/* MRR & Revenue Charts */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <ChartCard title="MRR Trend (6 Bulan)">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mrrGrowth.trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'MRR']}
                  labelFormatter={(label) => `Bulan: ${label}`}
                />
                <Area type="monotone" dataKey="mrr" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="MRR Breakdown">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-sm text-emerald-600 font-medium">Expansion</div>
                <div className="text-2xl font-bold text-emerald-700">{formatCurrency(mrrGrowth.expansion)}</div>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="text-sm text-red-600 font-medium">Contraction</div>
                <div className="text-2xl font-bold text-red-700">{formatCurrency(mrrGrowth.contraction)}</div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-sm text-muted-foreground font-medium">Net New MRR</div>
              <div className={`text-2xl font-bold ${mrrGrowth.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {mrrGrowth.net >= 0 ? '+' : ''}{formatCurrency(mrrGrowth.net)}
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Churn & Retention */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <ChartCard title="Churn Rate Trend">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={churnRate.trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" unit="%" />
                <Tooltip formatter={(value: number) => [`${value}%`, 'Churn Rate']} />
                <Line type="monotone" dataKey="rate" stroke={CHART_COLORS[4]} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-4">
            <div className="flex-1 p-3 rounded-lg bg-muted">
              <div className="text-xs text-muted-foreground">Monthly</div>
              <div className="text-lg font-bold">{churnRate.monthly}%</div>
            </div>
            <div className="flex-1 p-3 rounded-lg bg-muted">
              <div className="text-xs text-muted-foreground">Quarterly</div>
              <div className="text-lg font-bold">{churnRate.quarterly}%</div>
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Net Revenue Retention">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netRevenueRetention.trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" unit="%" domain={[0, 120]} />
                <Tooltip formatter={(value: number) => [`${value}%`, 'NRR']} />
                <Area type="monotone" dataKey="nrr" stroke={CHART_COLORS[2]} fill={CHART_COLORS[2]} fillOpacity={0.2} />
                <Line y={100} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-muted">
            <div className="text-xs text-muted-foreground">Current NRR</div>
            <div className={`text-2xl font-bold ${netRevenueRetention.current >= 100 ? 'text-emerald-600' : 'text-red-600'}`}>
              {netRevenueRetention.current}%
            </div>
          </div>
        </ChartCard>
      </div>

      {/* LTV & ARPU */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <ChartCard title="Customer Lifetime Value (LTV)">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ltv.byPlan}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="plan" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'LTV']} />
                <Bar dataKey="ltv" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-muted">
            <div className="text-xs text-muted-foreground">Average LTV</div>
            <div className="text-2xl font-bold">{formatCurrency(ltv.average)}</div>
          </div>
        </ChartCard>

        <ChartCard title="ARPU (Average Revenue Per User)">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={arpu.trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), 'ARPU']} />
                <Line type="monotone" dataKey="arpu" stroke={CHART_COLORS[3]} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {arpu.byPlan.map((item, i) => (
              <div key={item.plan} className="p-3 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground">{item.plan}</div>
                <div className="text-lg font-bold">{formatCurrency(item.arpu)}</div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Cohort Retention */}
      <ChartCard title="Cohort Retention Analysis">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium text-muted-foreground">Cohort</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Size</th>
                {Array.from({ length: 7 }, (_, i) => (
                  <th key={i} className="text-center p-3 font-medium text-muted-foreground">
                    M{i}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohortRetention.map((cohort) => (
                <tr key={cohort.cohort} className="border-b border-border/50">
                  <td className="p-3 font-medium">{cohort.cohort}</td>
                  <td className="p-3 text-center text-muted-foreground">{cohort.size}</td>
                  {Array.from({ length: 7 }, (_, i) => {
                    const value = cohort.retention[i];
                    const opacity = value ? Math.max(0.1, value / 100) : 0;
                    return (
                      <td
                        key={i}
                        className="p-3 text-center"
                        style={{
                          backgroundColor: value ? `hsl(var(--chart-2) / ${opacity})` : undefined,
                        }}
                      >
                        {value ? `${value}%` : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
