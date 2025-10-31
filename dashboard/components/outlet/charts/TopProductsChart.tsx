'use client';

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
import { Badge } from '@/components/ui/badge';

interface TopProduct {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
  type: 'GOODS' | 'SERVICE';
  rank?: number;
}

interface TopProductsChartProps {
  data: TopProduct[];
}

const PRODUCT_COLORS = {
  GOODS: '#ef4444',
  SERVICE: '#3b82f6',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-3 shadow-xl border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
          {data.name}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Terjual: <span className="font-medium">{data.quantity}</span>
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Revenue: <span className="font-medium">Rp {data.revenue.toLocaleString('id-ID')}</span>
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Tipe: <span className="font-medium">{data.type}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function TopProductsChart({ data }: TopProductsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);

  // Chart data sorted by revenue
  const chartData = [...data].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-6 shadow-xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Top 5 Produk Terlaris
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total Revenue: Rp {totalRevenue.toLocaleString('id-ID')}
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 p-1 bg-white/10 dark:bg-gray-700/50 rounded-xl backdrop-blur-sm border border-white/20 dark:border-gray-600/50">
            {(['chart', 'table'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 capitalize ${
                  viewMode === mode
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {mode === 'chart' ? '📊' : '📋'} {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewMode === 'chart' ? (
        // Chart View
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" horizontal={false} />
              <XAxis type="number" stroke="#999" style={{ fontSize: '12px' }} />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#999"
                style={{ fontSize: '11px' }}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="revenue"
                fill="#ef4444"
                radius={[0, 8, 8, 0]}
                onMouseEnter={(_, index) => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                isAnimationActive={true}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PRODUCT_COLORS[entry.type]}
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
      ) : (
        // Table View
        <div className="space-y-3">
          {chartData.map((product, index) => (
            <div
              key={product.id}
              className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                hoveredIndex === index
                  ? 'bg-white/20 dark:bg-gray-700/50 border-white/30 dark:border-gray-600/50 scale-102 shadow-lg'
                  : 'bg-white/5 dark:bg-gray-700/20 border-white/10 dark:border-gray-700/30'
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
                    <span className="text-sm font-bold text-white">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {product.name}
                    </p>
                    <Badge
                      variant="outline"
                      className={`mt-1 ${
                        product.type === 'GOODS'
                          ? 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/50'
                          : 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50'
                      }`}
                    >
                      {product.type}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    Rp {product.revenue.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {product.quantity} terjual
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    product.type === 'GOODS'
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600'
                  }`}
                  style={{
                    width: `${(product.revenue / (chartData[0]?.revenue || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10 dark:border-gray-700/50">
        <div className="text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Penjualan</p>
          <p className="font-bold text-orange-600 dark:text-orange-400">
            {totalQuantity}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Rata-rata/Produk</p>
          <p className="font-bold text-blue-600 dark:text-blue-400">
            {Math.round(totalRevenue / data.length).toLocaleString('id-ID')}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Produk Aktif</p>
          <p className="font-bold text-green-600 dark:text-green-400">
            {data.length}
          </p>
        </div>
      </div>
    </div>
  );
}
