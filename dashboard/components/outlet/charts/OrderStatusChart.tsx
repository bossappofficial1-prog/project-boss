'use client';

import { formatStatusPesanan } from '@/lib/formatter';
import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface OrderStatusData {
  status: string;
  count: number;
  percentage: number;
  totalAmount?: number;
}

interface OrderStatusChartProps {
  data: OrderStatusData[];
  completionRate: number;
}

const STATUS_COLORS = {
  COMPLETED: '#10b981',
  PROCESSING: '#3b82f6',
  AWAITING_PAYMENT: '#f59e0b',
  CANCELLED: '#ef4444',
  CONFIRMED: '#8b5cf6',
  READY: '#06b6d4',
  ON_GOING: '#ec4899',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-3 shadow-xl border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
          {data.status}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Jumlah: <span className="font-medium">{data.count}</span>
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Persentase: <span className="font-medium">{data.percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function OrderStatusChart({
  data,
  completionRate,
}: OrderStatusChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalOrders = data.reduce((sum, item) => sum + item.count, 0);
  const chartData = data.filter((item) => item.status !== 'COMPLETED').map(order => ({ ...order, status: formatStatusPesanan(order.status as any) }));

  const getOriginalIndex = (filteredIndex: number | null) => {
    if (filteredIndex === null) return null;
    const hoveredStatus = chartData[filteredIndex]?.status;
    if (!hoveredStatus) return null;
    return data.findIndex(item => item.status === hoveredStatus);
  };

  return (
    <div className="rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-6 shadow-xl h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Status Pesanan
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total: {totalOrders.toLocaleString('id-ID')} pesanan
            </p>
          </div>

          {/* Completion Rate Badge */}
          <div className="text-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Tingkat Selesai
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {completionRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }} // Margin disesuaikan
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
            <XAxis
              dataKey="status"
              textAnchor="end"
              height={60} // Mengurangi height karena label lebih sedikit
              interval={0}
              tick={{ fontSize: 12 }}
              stroke="#999"
            />
            <YAxis stroke="#999" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              fill="#ef4444"
              radius={[8, 8, 0, 0]}
              onMouseEnter={(_, index) => setHoveredIndex(getOriginalIndex(index))}
              onMouseLeave={() => setHoveredIndex(null)}
              isAnimationActive={true}
            >
              {chartData.map((entry, index) => ( // <-- Gunakan chartData
                <Cell
                  key={`cell-${index}`}
                  fill={
                    STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#6b7280'
                  }
                  opacity={
                    hoveredIndex === null || hoveredIndex === getOriginalIndex(index) ? 1 : 0.5 // <-- Map index
                  }
                  style={{
                    filter:
                      hoveredIndex === getOriginalIndex(index) ? 'brightness(1.2)' : 'brightness(1)', // <-- Map index
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 dark:border-gray-700/50">
        {data.map((item, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg transition-all duration-200 cursor-pointer ${hoveredIndex === index
              ? 'bg-white/20 dark:bg-gray-700/50 scale-105'
              : 'bg-white/5 dark:bg-gray-700/20'
              }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] ||
                    '#6b7280',
                }}
              />
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                {formatStatusPesanan(item.status as any)}
              </p>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {item.count}
            </p>
            <div className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor:
                    STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] ||
                    '#6b7280',
                }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {item.percentage}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}