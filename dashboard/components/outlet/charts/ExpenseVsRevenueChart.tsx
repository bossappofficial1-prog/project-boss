'use client';

import { useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ExpenseVsRevenueData {
  revenue: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
}

interface ExpenseVsRevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    expenses: number;
  }>;
  summary: ExpenseVsRevenueData;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-2xl">
        <p className="text-gray-300 font-semibold mb-3 text-sm">{data.date}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-gray-400 text-xs">Pendapatan</span>
            </div>
            <span className="text-emerald-400 font-bold text-sm">
              Rp {data.revenue.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-400 text-xs">Pengeluaran</span>
            </div>
            <span className="text-red-400 font-bold text-sm">
              Rp {data.expenses.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="border-t border-gray-700 pt-2 mt-2">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-400 text-xs">Laba Bersih</span>
              </div>
              <span className={`font-bold text-sm ${(data.revenue - data.expenses) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                Rp {(data.revenue - data.expenses).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function ExpenseVsRevenueChart({
  data,
  summary,
}: ExpenseVsRevenueChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Pengeluaran vs Pendapatan
        </h3>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Revenue */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Pendapatan Bulan Ini
            </p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              Rp {summary.revenue.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Expenses */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Pengeluaran Bulan Ini
            </p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              Rp {summary.expenses.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Net Profit */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Laba Bersih
            </p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              Rp {summary.netProfit.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Profit Margin */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Margin Keuntungan
            </p>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {summary.profitMargin}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[30em] w-full">
        <ResponsiveContainer width="100%" height={480}>
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              vertical={false}
              opacity={0.3}
            />

            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: '#4b5563' }}
              dy={10}
            />

            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />

            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              formatter={(value) => <span className="text-gray-300 text-sm">{value}</span>}
            />

            <Bar
              dataKey="revenue"
              fill="url(#revenueGradient)"
              name="Pendapatan"
              radius={[8, 8, 0, 0]}
              maxBarSize={50}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />

            <Bar
              dataKey="expenses"
              fill="url(#expensesGradient)"
              name="Pengeluaran"
              radius={[8, 8, 0, 0]}
              maxBarSize={50}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey={(entry) => entry.revenue - entry.expenses}
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{
                fill: '#3b82f6',
                r: 5,
                strokeWidth: 2,
                stroke: '#1e40af'
              }}
              activeDot={{
                r: 8,
                fill: '#2563eb',
                strokeWidth: 3,
                stroke: '#fff',
                filter: 'url(#glow)'
              }}
              name="Laba Bersih"
              isAnimationActive={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
