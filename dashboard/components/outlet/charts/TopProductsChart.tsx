'use client'

import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { TopProduct } from '@/types'

interface TopProductsChartProps {
  data: TopProduct[]
}

const PRODUCT_COLORS: Record<TopProduct['type'], string> = {
  GOODS: '#2563eb',
  SERVICE: '#f59e0b'
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const item = payload[0].payload as TopProduct

  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
      <div className="mt-2 space-y-1 text-[11px] text-gray-600 dark:text-gray-400">
        <p className="flex justify-between">
          <span>Terjual</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{item.quantity}</span>
        </p>
        <p className="flex justify-between">
          <span>Revenue</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">Rp {item.revenue.toLocaleString('id-ID')}</span>
        </p>
        <p className="flex justify-between">
          <span>Tipe</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{item.type === 'GOODS' ? 'Produk' : 'Jasa'}</span>
        </p>
      </div>
    </div>
  )
}

export default function TopProductsChart({ data }: TopProductsChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const { totalRevenue, totalQuantity, chartData } = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.revenue - a.revenue)
    const revenueSum = sorted.reduce((sum, item) => sum + item.revenue, 0)
    const quantitySum = sorted.reduce((sum, item) => sum + item.quantity, 0)
    return {
      chartData: sorted,
      totalRevenue: revenueSum,
      totalQuantity: quantitySum
    }
  }, [data])

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500">Produk</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Produk Terlaris</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Total revenue: Rp {totalRevenue.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-1 py-1 text-xs font-medium dark:border-gray-700 dark:bg-gray-900">
          {(['chart', 'table'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`rounded-full px-3 py-1 transition-colors ${viewMode === mode
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-100 dark:text-gray-900'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
            >
              {mode === 'chart' ? 'Chart' : 'Tabel'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total produk</p>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">{data.length}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total penjualan</p>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">{totalQuantity}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Pendapatan tertinggi</p>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
            Rp {chartData[0]?.revenue.toLocaleString('id-ID')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Produk teratas</p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{chartData[0]?.name}</p>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className="mt-6 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={370}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />

              <XAxis
                dataKey="name"
                textAnchor="end"
                height={70}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                stroke="#e5e7eb"
              />

              <YAxis
                stroke="#e5e7eb"
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: '#f1f5f9', opacity: 0.6 }}
              />

              <Bar
                dataKey="revenue"
                radius={[6, 6, 0, 0]}
                onMouseEnter={(_, index) => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={entry.id}
                    fill={PRODUCT_COLORS[entry.type]}
                    opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.4}
                    style={{
                      transition: 'opacity 0.2s ease, transform 0.2s ease',
                      transform: hoveredIndex === index ? 'scale(1.02)' : 'scale(1)',
                      transformOrigin: 'bottom'
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {chartData.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`w-full rounded-lg border px-4 py-4 text-left transition-all ${hoveredIndex === index
                ? 'border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900'
                : 'border-transparent bg-white dark:bg-gray-950'
                }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">#{index + 1}</span>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
                    <Badge variant={item.type === 'GOODS' ? 'default' : 'secondary'}>
                      {item.type === 'GOODS' ? 'Produk' : 'Jasa'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Terjual {item.quantity} · Rp {item.revenue.toLocaleString('id-ID')}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {((item.revenue / Math.max(totalRevenue, 1)) * 100).toFixed(1)}%
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 border-t border-gray-100 pt-3 text-sm dark:border-gray-800 sm:grid-cols-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total penjualan</p>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">{totalQuantity}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Rata-rata per produk</p>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
            Rp {Math.round(totalRevenue / Math.max(data.length, 1)).toLocaleString('id-ID')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Jumlah produk aktif</p>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">{data.length}</p>
        </div>
      </div>
    </div>
  )
}
