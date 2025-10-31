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
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-3 shadow-xl border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
          {data.date}
        </p>
        <p className="text-xs text-green-600 dark:text-green-400">
          Revenue: <span className="font-medium">Rp {data.revenue.toLocaleString('id-ID')}</span>
        </p>
        <p className="text-xs text-red-600 dark:text-red-400">
          Expenses: <span className="font-medium">Rp {data.expenses.toLocaleString('id-ID')}</span>
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
          Profit: Rp {(data.revenue - data.expenses).toLocaleString('id-ID')}
        </p>
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

  // Calculate summary for chart data
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);

  return (
    <div className="rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-6 shadow-xl">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Pengeluaran vs Pendapatan
        </h3>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
            <XAxis
              dataKey="date"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={Math.floor(data.length / 7)}
              tick={{ fontSize: 12 }}
              stroke="#999"
            />
            <YAxis stroke="#999" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#999" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Revenue Bar */}
            <Bar
              dataKey="revenue"
              fill="#10b981"
              name="Pendapatan"
              radius={[8, 8, 0, 0]}
              opacity={0.8}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />

            {/* Expenses Bar */}
            <Bar
              dataKey="expenses"
              fill="#ef4444"
              name="Pengeluaran"
              radius={[8, 8, 0, 0]}
              opacity={0.8}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />

            {/* Profit Line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey={(entry) => entry.revenue - entry.expenses}
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7, fill: '#2563eb' }}
              name="Laba Bersih"
              isAnimationActive={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10 dark:border-gray-700/50">
        <div className="text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            Total Revenue
          </p>
          <p className="font-bold text-green-600 dark:text-green-400">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            Total Expenses
          </p>
          <p className="font-bold text-red-600 dark:text-red-400">
            Rp {totalExpenses.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            Total Profit
          </p>
          <p className="font-bold text-blue-600 dark:text-blue-400">
            Rp {(totalRevenue - totalExpenses).toLocaleString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  );
}
