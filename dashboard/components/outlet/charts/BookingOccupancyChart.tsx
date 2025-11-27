'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface BookingOccupancyData {
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  occupancyRate: number;
}

interface BookingOccupancyChartProps {
  data: BookingOccupancyData;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg p-3 shadow-xl border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {item.name}: <span className="font-medium">{item.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function BookingOccupancyChart({
  data,
}: BookingOccupancyChartProps) {
  const chartData = [
    {
      name: 'Terisi',
      value: data.bookedSlots,
      fill: '#10b981',
    },
    {
      name: 'Tersedia',
      value: data.availableSlots,
      fill: '#e5e7eb',
    },
  ];

  const occupancyPercentage = Math.round(
    (data.bookedSlots / data.totalSlots) * 100
  );

  // Color based on occupancy rate
  let statusColor = 'text-red-600 dark:text-red-400';
  let statusBg = 'bg-red-500/20 border-red-500/30';
  
  if (occupancyPercentage >= 75) {
    statusColor = 'text-green-600 dark:text-green-400';
    statusBg = 'bg-green-500/20 border-green-500/30';
  } else if (occupancyPercentage >= 50) {
    statusColor = 'text-yellow-600 dark:text-yellow-400';
    statusBg = 'bg-yellow-500/20 border-yellow-500/30';
  }

  return (
    <div className="rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-6 shadow-xl h-full">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Kepadatan Booking
        </h3>

        {/* Main Gauge */}
        <div className={`p-4 rounded-xl border ${statusBg}`}>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Tingkat Kepadatan
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className={`text-4xl font-bold ${statusColor}`}>
                {occupancyPercentage}%
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {data.bookedSlots} dari {data.totalSlots} slot
              </p>
            </div>

            {/* Circular Progress */}
            <div className="relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                  fill="none"
                  className="dark:stroke-gray-700"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${(occupancyPercentage / 100) * 220} 220`}
                  className={statusColor}
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xs font-bold ${statusColor}`}>
                  {occupancyPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="w-full h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
            <XAxis type="number" stroke="#999" style={{ fontSize: '12px' }} />
            <YAxis dataKey="name" type="category" stroke="#999" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 dark:border-gray-700/50">
        <div className="text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Terisi</p>
          <p className="font-bold text-green-600 dark:text-green-400">
            {data.bookedSlots}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tersedia</p>
          <p className="font-bold text-gray-600 dark:text-gray-400">
            {data.availableSlots}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</p>
          <p className="font-bold text-blue-600 dark:text-blue-400">
            {data.totalSlots}
          </p>
        </div>
      </div>
    </div>
  );
}
