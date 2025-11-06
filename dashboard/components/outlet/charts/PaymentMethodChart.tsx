'use client';

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

interface PaymentMethod {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

interface PaymentMethodChartProps {
  data: PaymentMethod[];
}

const METHOD_COLORS = {
  QRIS: '#10b981',
  Transfer: '#3b82f6',
  'Tunai/Manual': '#f59e0b',
  Booking: '#8b5cf6',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-3 shadow-xl border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
          {data.method}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Transaksi: <span className="font-medium">{data.count}</span>
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Nominal: <span className="font-medium">Rp {data.amount.toLocaleString('id-ID')}</span>
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Persentase: <span className="font-medium">{data.percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function PaymentMethodChart({ data }: PaymentMethodChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          Metode Pembayaran
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total: Rp {totalAmount.toLocaleString('id-ID')}
        </p>
      </div>

      {/* Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" minHeight={430}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
            <XAxis
              dataKey="method"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fontSize: 12 }}
              stroke="#999"
            />
            <YAxis stroke="#999" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="amount"
              fill="#10b981"
              radius={[8, 8, 0, 0]}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              isAnimationActive={true}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    METHOD_COLORS[entry.method as keyof typeof METHOD_COLORS] ||
                    '#6b7280'
                  }
                  opacity={
                    hoveredIndex === null || hoveredIndex === index ? 1 : 0.5
                  }
                  style={{
                    filter:
                      hoveredIndex === index ? 'brightness(1.2)' : 'brightness(1)',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Details Grid */}
      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-3 text-sm dark:border-gray-700/50 lg:grid-cols-4">
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
                    METHOD_COLORS[item.method as keyof typeof METHOD_COLORS] ||
                    '#6b7280',
                }}
              />
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {item.method}
              </p>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {item.count}x
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {item.percentage}%
            </p>
          </div>
        ))}
      </div>
    </div >
  );
}
