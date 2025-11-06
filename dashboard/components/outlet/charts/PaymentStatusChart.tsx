'use client';

import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
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
          <span>Nominal</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">Rp {data.amount.toLocaleString('id-ID')}</span>
        </p>
      </div>
    </div>
  );
};

export default function PaymentStatusChart({
  data,
  successRate,
}: PaymentStatusChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate total
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="h-full rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500">Pembayaran</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Status Pembayaran</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Total transaksi: Rp {total.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-100/60 px-4 py-2 text-right dark:border-emerald-900/40 dark:bg-emerald-900/20">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Tingkat sukses</p>
          <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-300">{successRate}%</p>
        </div>
      </div>

      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percentage }) => `${percentage}%`}
              outerRadius={102}
              innerRadius={64}
              dataKey="amount"
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.status as keyof typeof COLORS] || '#94a3b8'}
                  opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.45}
                  style={{
                    transition: 'opacity 0.2s ease, transform 0.2s ease',
                    transform: hoveredIndex === index ? 'scale(1.02)' : 'scale(1)',
                    transformOrigin: 'center',
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 border-t border-gray-100 pt-3 text-sm dark:border-gray-800 sm:grid-cols-3">
        {data.map((item, index) => (
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
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{item.status}</span>
              <span>{item.percentage}%</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
              {item.count} transaksi
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Rp {item.amount.toLocaleString('id-ID')}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
