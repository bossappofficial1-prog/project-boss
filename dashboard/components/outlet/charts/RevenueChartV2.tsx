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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/95 backdrop-blur-sm px-4 py-3 shadow-2xl">
      <p className="font-semibold text-gray-100 mb-2 text-xs">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-8 text-xs mb-1.5 last:mb-0">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-400">{entry.name}</span>
          </div>
          <span className="font-bold text-gray-100">
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

  const axisTickStyle = { fontSize: 11, fill: '#6b7280' } as const;

  if (!outletId) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
        <div className="text-sm text-gray-500 dark:text-gray-400">Pilih outlet untuk melihat tren pendapatan.</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500">Pendapatan</p>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Tren Pendapatan</h3>

          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Total periode</p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Rp {stats.totalRevenue.toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Rata-rata harian</p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Rp {stats.avgRevenue.toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Puncak pendapatan</p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Rp {stats.maxRevenue.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-1 py-1">
            {timeframeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeframe(option.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${timeframe === option.value
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-1 py-1">
            {(['line', 'area'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${chartType === type
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-100 dark:text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                  }`}
              >
                {type === 'line' ? 'Line' : 'Area'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 h-72 w-full">
        {isPending ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">Memuat data pendapatan…</div>
        ) : isErrored ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500 dark:text-red-400">Gagal memuat data pendapatan.</div>
        ) : !hasData ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">Belum ada data pendapatan pada periode ini.</div>
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
                  stroke="#374151"
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.5}
                />
                <XAxis
                  dataKey="date"
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={{ stroke: '#4b5563' }}
                  interval={Math.floor(filteredData.length / 7)}
                />
                <YAxis
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={{ stroke: '#4b5563' }}
                  width={70}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6b7280', strokeDasharray: '3 3' }} />
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
                  stroke="#374151"
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.5}
                />
                <XAxis
                  dataKey="date"
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={{ stroke: '#4b5563' }}
                  interval={Math.floor(filteredData.length / 7)}
                />
                <YAxis
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={{ stroke: '#4b5563' }}
                  width={70}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6b7280', strokeDasharray: '3 3' }} />
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
    </div>
  );
}
