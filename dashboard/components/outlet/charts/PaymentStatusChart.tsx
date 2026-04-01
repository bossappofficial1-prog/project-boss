'use client';

import { PieChartIcon } from 'lucide-react';
import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { EmptyChart } from './EmptyChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  SUCCESS: '#10B981',
  PENDING: '#F59E0B',
  PROOF_SUBMITTED: '#3B82F6',
  AWAITING_VERIFICATION: '#6366F1',
  FAILED: '#EF4444',
  REJECTED_MANUAL: '#8B5CF6',
  EXPIRED: '#6B7280',
  REFUNDED: '#14B8A6',
  CANCELLED: '#9CA3AF',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-sm">
      <p className="text-sm font-semibold text-foreground">{data.status}</p>
      <div className="text-muted-foreground mt-2 space-y-1 text-[11px]">
        <p className="flex justify-between">
          <span>Jumlah</span>
          <span className="font-semibold text-foreground">{data.count}</span>
        </p>
        <p className="flex justify-between">
          <span>Nominal</span>
          <span className="font-semibold text-foreground">Rp {data.amount.toLocaleString('id-ID')}</span>
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
    <Card className="h-full rounded-md py-5">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Pembayaran</p>
          <CardTitle className="text-lg">Status Pembayaran</CardTitle>
          <CardDescription className="mt-2 text-sm">
            Total transaksi: Rp {total.toLocaleString('id-ID')}
          </CardDescription>
        </div>

        <Badge variant="success" className="rounded-md border border-emerald-200 bg-emerald-100/60 px-4 py-2 text-right dark:border-emerald-900/40 dark:bg-emerald-900/20">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Tingkat sukses</p>
          <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-300">{successRate}%</p>
        </Badge>
      </CardHeader>

      <CardContent className="mt-2">
        <div className="h-72 w-full">
          {data.length > 0
            ?
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
            : <EmptyChart icon={PieChartIcon} />
          }
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 border-t border-border pt-3 text-sm sm:grid-cols-3">
          {data.map((item, index) => (
            <button
              key={index}
              type="button"
              className={`text-left rounded-md border px-3 py-3 transition-all ${hoveredIndex === index
                ? 'border-border bg-muted/60'
                : 'border-transparent bg-transparent'
                }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>{item.status}</span>
                <span>{item.percentage}%</span>
              </div>
              <p className="text-foreground mt-1 text-sm font-semibold">
                {item.count} transaksi
              </p>
              <p className="text-muted-foreground text-xs">
                Rp {item.amount.toLocaleString('id-ID')}
              </p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
