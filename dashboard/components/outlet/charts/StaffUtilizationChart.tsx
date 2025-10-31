'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface StaffUtilization {
  staffId: string;
  staffName: string;
  bookingCount: number;
  utilization: number;
}

interface StaffUtilizationChartProps {
  data: StaffUtilization[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-3 shadow-xl border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
          {data.staffName}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Booking: <span className="font-medium">{data.bookingCount}</span>
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Utilisasi: <span className="font-medium">{data.utilization}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const getUtilizationColor = (utilization: number) => {
  if (utilization >= 80) return '#10b981';
  if (utilization >= 60) return '#3b82f6';
  if (utilization >= 40) return '#f59e0b';
  return '#ef4444';
};

export default function StaffUtilizationChart({
  data,
}: StaffUtilizationChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const sortedData = [...data].sort((a, b) => b.utilization - a.utilization);
  const avgUtilization = Math.round(
    data.reduce((sum, item) => sum + item.utilization, 0) / data.length
  );

  return (
    <div className="rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-6 shadow-xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Utilisasi Staff
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Rata-rata: {avgUtilization}%
            </p>
          </div>

          {/* Average Badge */}
          <div className="text-center px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Staff Aktif
            </p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {data.length}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
            <XAxis
              dataKey="staffName"
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
              dataKey="utilization"
              fill="#8b5cf6"
              radius={[8, 8, 0, 0]}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              isAnimationActive={true}
            >
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getUtilizationColor(entry.utilization)}
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

      {/* Details */}
      <div className="space-y-2 mt-6 pt-6 border-t border-white/10 dark:border-gray-700/50">
        {sortedData.map((item, index) => (
          <div
            key={item.staffId}
            className={`p-3 rounded-lg transition-all duration-200 cursor-pointer ${
              hoveredIndex === index
                ? 'bg-white/20 dark:bg-gray-700/50'
                : 'bg-white/5 dark:bg-gray-700/20'
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-900 dark:text-white">
                {item.staffName}
              </p>
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                {item.bookingCount} booking
              </span>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${item.utilization}%`,
                    backgroundColor: getUtilizationColor(item.utilization),
                  }}
                />
              </div>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-10 text-right">
                {item.utilization}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
