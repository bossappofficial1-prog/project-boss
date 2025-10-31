'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ProductTypeData {
  type: 'GOODS' | 'SERVICE';
  count: number;
  percentage: number;
  activeCount: number;
}

interface ProductTypeChartProps {
  data: ProductTypeData[];
}

const COLORS = {
  GOODS: '#ef4444',
  SERVICE: '#3b82f6',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-3 shadow-xl border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
          {data.type}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Total: <span className="font-medium">{data.count}</span>
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Aktif: <span className="font-medium">{data.activeCount}</span>
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Persentase: <span className="font-medium">{data.percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function ProductTypeChart({ data }: ProductTypeChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalProducts = data.reduce((sum, item) => sum + item.count, 0);
  const totalActive = data.reduce((sum, item) => sum + item.activeCount, 0);

  return (
    <div className="rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-6 shadow-xl h-full">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          Tipe Produk
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total: {totalProducts} produk ({totalActive} aktif)
        </p>
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
              label={({ percentage }) => `${percentage}%`}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="count"
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.type]}
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
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-white/10 dark:border-gray-700/50">
        {data.map((item, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg transition-all duration-200 cursor-pointer ${
              hoveredIndex === index
                ? 'bg-white/20 dark:bg-gray-700/50 scale-105'
                : 'bg-white/5 dark:bg-gray-700/20'
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[item.type] }}
              />
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {item.type}
              </p>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {item.count}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {item.activeCount} aktif · {item.percentage}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
