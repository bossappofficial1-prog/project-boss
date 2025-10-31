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
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts';
import { TimeframeFilter } from '@/types/outlet';
import { subDays, subMonths } from 'date-fns';
import { TrendingUp, TrendingDown, MoreVertical } from 'lucide-react';

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

const timeframeOptions: { value: TimeframeFilter; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '3m', label: '3M' },
];

// Custom Tooltip dengan styling minimal
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white/95 dark:bg-gray-900/95 rounded-lg p-2 shadow-lg border border-gray-200 dark:border-gray-700 text-xs">
        <p className="font-semibold text-gray-800 dark:text-white mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-xs">
            {entry.name}: {entry.value.toLocaleString('id-ID')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ data }: RevenueChartProps) {
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('30d');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');

  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate = now;

    if (timeframe === '7d') startDate = subDays(now, 7);
    else if (timeframe === '30d') startDate = subDays(now, 30);
    else if (timeframe === '3m') startDate = subMonths(now, 3);
    console.log(startDate);

    return data.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });
  }, [data, timeframe]);

  const stats = useMemo(() => {
    if (filteredData.length === 0) return { avgRevenue: 0, maxRevenue: 0, totalRevenue: 0 };
    const revenues = filteredData.map((d) => d.revenue);
    const totalRevenue = revenues.reduce((a, b) => a + b, 0);
    const avgRevenue = Math.round(totalRevenue / revenues.length);
    const maxRevenue = Math.max(...revenues);
    return { avgRevenue, maxRevenue, totalRevenue };
  }, [filteredData]);

  return (
    <div className="rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Tren Pendapatan
          </h3>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
              <p className="font-bold text-green-600 dark:text-green-400">
                Rp {stats.totalRevenue.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Rata-rata</p>
              <p className="font-bold text-blue-600 dark:text-blue-400">
                Rp {stats.avgRevenue.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Controls - Compact */}
        <div className="flex items-center gap-2">
          {/* Timeframe */}
          <div className="flex gap-1 p-1 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg">
            {timeframeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeframe(option.value)}
                className={`px-2 py-1 rounded text-xs font-semibold transition-all ${timeframe === option.value
                    ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Chart Type */}
          <div className="flex gap-1 p-1 bg-gray-200/50 dark:bg-gray-700/30 rounded-lg">
            {(['area', 'line'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-2 py-1 rounded text-xs font-semibold transition-all ${chartType === type
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                {type === 'area' ? 'Area' : 'Line'}
              </button>
            ))}
          </div>

          <button className="p-1 hover:bg-gray-200/50 dark:hover:bg-gray-700/30 rounded-lg transition-all">
            <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={filteredData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
              <XAxis dataKey="date" stroke="#999" style={{ fontSize: '11px' }} />
              <YAxis stroke="#999" style={{ fontSize: '11px' }} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={false}
                name="Pendapatan"
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="none"
                dot={false}
                name="Pesanan"
                yAxisId="right"
              />
              <YAxis yAxisId="right" orientation="right" stroke="#999" style={{ fontSize: '11px' }} width={50} />
            </AreaChart>
          ) : (
            <LineChart data={filteredData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
              <XAxis dataKey="date" stroke="#999" style={{ fontSize: '11px' }} />
              <YAxis stroke="#999" style={{ fontSize: '11px' }} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#ef4444"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
                name="Pendapatan"
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name="Pesanan"
                yAxisId="right"
              />
              <YAxis yAxisId="right" orientation="right" stroke="#999" style={{ fontSize: '11px' }} width={50} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
