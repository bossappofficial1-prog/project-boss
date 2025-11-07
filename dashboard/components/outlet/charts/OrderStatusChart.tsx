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
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { EmptyChart } from './EmptyChart';
import { BarChart2Icon } from 'lucide-react';

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
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs shadow-sm">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{data.status}</p>
      <div className="mt-2 space-y-1 text-[11px] text-gray-600 dark:text-gray-400">
        <p className="flex justify-between">
          <span>Jumlah</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{data.count}</span>
        </p>
        <p className="flex justify-between">
          <span>Persentase</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{data.percentage}%</span>
        </p>
      </div>
    </div>
  );
};

export default function OrderStatusChart({
  data,
  completionRate,
}: OrderStatusChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalOrders = data.reduce((sum, item) => sum + item.count, 0);
  const chartData = data.filter((item) => item.status !== 'COMPLETED');

  const getOriginalIndex = (filteredIndex: number | null) => {
    if (filteredIndex === null) return null;
    const hoveredStatus = chartData[filteredIndex]?.status;
    if (!hoveredStatus) return null;
    return data.findIndex(item => item.status === hoveredStatus);
  };

  return (
    <div className="h-full rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500">Pesanan</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Status Pesanan</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Total: {totalOrders.toLocaleString('id-ID')} pesanan
          </p>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-100/60 px-4 py-2 text-right dark:border-blue-900/40 dark:bg-blue-900/20">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-300">Tingkat selesai</p>
          <p className="text-xl font-semibold text-blue-600 dark:text-blue-300">{completionRate}%</p>
        </div>
      </div>

      <div className="mt-6 h-72 w-full">
        {
          chartData.length > 0
            ? <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="status"
                  interval={0}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  stroke="#e5e7eb"
                  tickFormatter={value => formatStatusPesanan(value)}
                />
                <YAxis stroke="#e5e7eb" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.6 }} />
                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                  onMouseEnter={(_, index) => setHoveredIndex(getOriginalIndex(index))}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#94a3b8'}
                      opacity={hoveredIndex === null || hoveredIndex === getOriginalIndex(index) ? 1 : 0.35}
                      style={{
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                        transform: hoveredIndex === getOriginalIndex(index) ? 'scale(1.02)' : 'scale(1)',
                        transformOrigin: 'bottom',
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            : <EmptyChart icon={BarChart2Icon} />
        }
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 border-t border-gray-100 pt-3 text-sm dark:border-gray-800 sm:grid-cols-3 lg:grid-cols-3">
        {chartData.map((item, index) => (
          <button
            key={index}
            type="button"
            className={`text-left rounded-lg border px-3 py-3 transition-all ${hoveredIndex === index
              ? 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'
              : 'border-transparent bg-white dark:bg-gray-950'
              }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex items-center gap-2">
              <span
                className="block h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || '#94a3b8',
                }}
              />
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {formatStatusPesanan(item.status as any)}
              </p>
            </div>
            <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              {item.count.toLocaleString('id-ID')} pesanan
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">{item.percentage}% dari total</p>
          </button>
        ))}
      </div>
    </div>
  );
}