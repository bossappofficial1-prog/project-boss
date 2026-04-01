'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TimeframeFilter } from '@/types/outlet';
import { useOutletRevenueTrend } from '@/hooks/useOutletRevenueTrend';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RevenueChartProps {
  outletId?: string;
}

const timeframeOptions: { value: TimeframeFilter; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '3m', label: '3M' },
];

const REVENUE_COLOR = '#23b26d';
const ORDERS_COLOR = '#1f6feb';
const AXIS_COLOR = 'hsl(var(--muted-foreground))';
const GRID_COLOR = 'hsl(var(--border))';
const CURSOR_COLOR = 'hsl(var(--muted-foreground))';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-border bg-popover px-4 py-3 text-popover-foreground shadow-md">
      <p className="mb-2 text-xs font-semibold">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-8 text-xs mb-1.5 last:mb-0">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
          </div>
          <span className="font-bold text-foreground">
            {entry.name === 'Pendapatan'
              ? `Rp ${entry.value.toLocaleString('id-ID')}`
              : entry.value.toLocaleString('id-ID')}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function RevenueChart({ outletId }: RevenueChartProps) {
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('30d');
  const [chartType, setChartType] = useState<'area' | 'line'>('line');

  const { data: trend, isPending, error } = useOutletRevenueTrend(outletId, { timeframe });

  const filteredData = trend?.data ?? [];

  const stats = useMemo(() => {
    if (trend?.totals) {
      return {
        totalRevenue: trend.totals.revenue,
        avgRevenue: trend.totals.averageRevenue,
        maxRevenue: trend.totals.maxRevenue,
      };
    }

    if (filteredData.length === 0) return { avgRevenue: 0, maxRevenue: 0, totalRevenue: 0 };

    const revenues = filteredData.map((d) => d.revenue);
    const totalRevenue = revenues.reduce((a, b) => a + b, 0);
    const avgRevenue = Math.round(totalRevenue / revenues.length);
    const maxRevenue = Math.max(...revenues);
    return { avgRevenue, maxRevenue, totalRevenue };
  }, [trend?.totals, filteredData]);

  const hasData = filteredData.length > 0;
  const isErrored = Boolean(error);

  const axisTickStyle = { fontSize: 11, fill: AXIS_COLOR } as const;

  if (!outletId) {
    return (
      <Card className="rounded-md py-5">
        <CardContent>
          <div className="text-sm text-muted-foreground">Pilih outlet untuk melihat tren pendapatan.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-md py-5">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Pendapatan</p>
          <CardTitle className="text-xl">Tren Pendapatan</CardTitle>

          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total periode</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                Rp {stats.totalRevenue.toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Rata-rata harian</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                Rp {stats.avgRevenue.toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Puncak pendapatan</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                Rp {stats.maxRevenue.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as TimeframeFilter)}>
            <TabsList className="h-auto rounded-full border border-border bg-muted p-1">
              {timeframeOptions.map((option) => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  className="h-7 rounded-full px-3 text-xs"
                >
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Tabs value={chartType} onValueChange={(value) => setChartType(value as 'area' | 'line')}>
            <TabsList className="h-auto rounded-full border border-border bg-muted p-1">
              {(['line', 'area'] as const).map((type) => (
                <TabsTrigger
                  key={type}
                  value={type}
                  className="h-7 rounded-full px-3 text-xs"
                >
                  {type === 'line' ? 'Line' : 'Area'}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="mt-2">
        <div className="h-72 w-full">
          {isPending ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Memuat data pendapatan…</div>
          ) : isErrored ? (
            <div className="text-destructive flex h-full items-center justify-center text-sm">Gagal memuat data pendapatan.</div>
          ) : !hasData ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data pendapatan pada periode ini.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={REVENUE_COLOR} stopOpacity={0.4} />
                      <stop offset="50%" stopColor={REVENUE_COLOR} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={REVENUE_COLOR} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ORDERS_COLOR} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={ORDERS_COLOR} stopOpacity={0} />
                    </linearGradient>
                    <filter id="shadow">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
                    </filter>
                  </defs>
                  <CartesianGrid
                    stroke={GRID_COLOR}
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="date"
                    tick={axisTickStyle}
                    tickLine={false}
                    axisLine={{ stroke: AXIS_COLOR }}
                    interval={Math.floor(filteredData.length / 7)}
                  />
                  <YAxis
                    tick={axisTickStyle}
                    tickLine={false}
                    axisLine={{ stroke: AXIS_COLOR }}
                    width={70}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: CURSOR_COLOR, strokeDasharray: '3 3' }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={REVENUE_COLOR}
                    strokeWidth={3}
                    fill="url(#revenueGradient)"
                    dot={false}
                    name="Pendapatan"
                    isAnimationActive={true}
                    filter="url(#shadow)"
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke={ORDERS_COLOR}
                    strokeWidth={2}
                    fill="url(#ordersGradient)"
                    dot={false}
                    name="Pesanan"
                    isAnimationActive={true}
                  />
                </AreaChart>
              ) : (
                <LineChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid
                    stroke={GRID_COLOR}
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="date"
                    tick={axisTickStyle}
                    tickLine={false}
                    axisLine={{ stroke: AXIS_COLOR }}
                    interval={Math.floor(filteredData.length / 7)}
                  />
                  <YAxis
                    tick={axisTickStyle}
                    tickLine={false}
                    axisLine={{ stroke: AXIS_COLOR }}
                    width={70}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: CURSOR_COLOR, strokeDasharray: '3 3' }} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={REVENUE_COLOR}
                    strokeWidth={3}
                    dot={{
                      fill: REVENUE_COLOR,
                      r: 4,
                      strokeWidth: 2,
                      stroke: '#065f46'
                    }}
                    activeDot={{
                      r: 6,
                      fill: REVENUE_COLOR,
                      strokeWidth: 3,
                      stroke: '#fff',
                      filter: 'url(#glow)'
                    }}
                    isAnimationActive={true}
                    name="Pendapatan"
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke={ORDERS_COLOR}
                    strokeWidth={2.5}
                    dot={{
                      fill: ORDERS_COLOR,
                      r: 3,
                      strokeWidth: 2,
                      stroke: '#1e40af'
                    }}
                    activeDot={{
                      r: 5,
                      fill: ORDERS_COLOR,
                      strokeWidth: 2,
                      stroke: '#fff'
                    }}
                    isAnimationActive={true}
                    name="Pesanan"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
