'use client';

import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface PaymentStatusData {
  status: string;
  count: number;
  amount: number;
  percentage?: number;
}

interface PaymentStatusChartProps {
  data: PaymentStatusData[];
  successRate: number;
}

const COLORS = {
  SUCCESS: '#10b981',
  PENDING: '#f59e0b',
  FAILED: '#ef4444',
  PROOF_SUBMITTED: '#3b82f6',
  REJECTED_MANUAL: '#8b5cf6',
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
          Nominal: <span className="font-medium">Rp {data.amount.toLocaleString('id-ID')}</span>
        </p>
      </div>
    );
  }
  return null;
};

const renderLabel = (entry: any) => {
  return `${entry.percentage}%`;
};

export default function PaymentStatusChart({
  data,
  successRate,
}: PaymentStatusChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate total
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-6 shadow-xl h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Status Pembayaran
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total: Rp {total.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Success Rate Badge */}
          <div className="text-center px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Tingkat Sukses
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {successRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="amount"
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    COLORS[entry.status as keyof typeof COLORS] || '#6b7280'
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
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => {
                const item = data?.[entry?.index];
                if (!item) return value;
                return `${item.status} (${item.count})`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10 dark:border-gray-700/50">
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
                    COLORS[item.status as keyof typeof COLORS] || '#6b7280',
                }}
              />
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {item.status}
              </p>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {item.count}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {item.percentage}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
