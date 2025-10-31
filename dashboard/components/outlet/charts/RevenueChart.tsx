'use client';

import { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
    Bar,
} from 'recharts';
import { TimeframeFilter, TimeframeRange } from '@/types/outlet';
import { subDays, subMonths, format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface RevenueChartProps {
    data: Array<{
        date: string;
        revenue: number;
        orders: number;
    }>;
}

const timeframeOptions: { value: TimeframeFilter; label: string }[] = [
    { value: '7d', label: '7 Hari' },
    { value: '30d', label: '30 Hari' },
    { value: '3m', label: '3 Bulan' },
];

// Custom Tooltip dengan styling modern
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-800 dark:text-white mb-2">
                    {label}
                </p>
                {payload.map((entry: any, index: number) => (
                    <p
                        key={index}
                        className="text-xs"
                        style={{ color: entry.color }}
                    >
                        <span className="font-medium">{entry.name}:</span> {entry.value.toLocaleString('id-ID')}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function RevenueChart({ data }: RevenueChartProps) {
    const [timeframe, setTimeframe] = useState<TimeframeFilter>('30d');
    const [chartType, setChartType] = useState<'area' | 'line' | 'composed'>('area');

    // Gradient definitions
    const gradientId = 'revenueGradient';
    const gradientIdOrders = 'ordersGradient';

    const filteredData = useMemo(() => {
        const now = new Date();
        let startDate = now;

        if (timeframe === '7d') startDate = subDays(now, 7);
        else if (timeframe === '30d') startDate = subDays(now, 30);
        else if (timeframe === '3m') startDate = subMonths(now, 3);

        return data.filter((item) => {
            const itemDate = new Date(item.date);
            return itemDate >= startDate;
        });
    }, [data, timeframe]);

    // Calculate statistics
    const stats = useMemo(() => {
        if (filteredData.length === 0) return { avgRevenue: 0, maxRevenue: 0, totalRevenue: 0 };

        const revenues = filteredData.map((d) => d.revenue);
        const totalRevenue = revenues.reduce((a, b) => a + b, 0);
        const avgRevenue = Math.round(totalRevenue / revenues.length);
        const maxRevenue = Math.max(...revenues);

        return { avgRevenue, maxRevenue, totalRevenue };
    }, [filteredData]);

    return (
        <div className="rounded-2xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-6 shadow-xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        Tren Pendapatan
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total: Rp {stats.totalRevenue.toLocaleString('id-ID')} | Rata-rata: Rp {stats.avgRevenue.toLocaleString('id-ID')}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap gap-2">
                    {/* Timeframe Filter */}
                    <div className="flex gap-2 p-1 bg-white/10 dark:bg-gray-700/50 rounded-xl backdrop-blur-sm border border-white/20 dark:border-gray-600/50">
                        {timeframeOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setTimeframe(option.value)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${timeframe === option.value
                                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {/* Chart Type Toggle */}
                    <div className="flex gap-1 p-1 bg-white/10 dark:bg-gray-700/50 rounded-xl backdrop-blur-sm border border-white/20 dark:border-gray-600/50">
                        {(['area', 'line', 'composed'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setChartType(type)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 capitalize ${chartType === type
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="w-full h-96 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'area' ? (
                        <AreaChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#999"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                            <YAxis yAxisId="right" orientation="right" stroke="#999" style={{ fontSize: '12px' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#ef4444"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill={`url(#${gradientId})`}
                                dot={{ fill: '#ef4444', r: 5 }}
                                activeDot={{ r: 7, fill: '#dc2626' }}
                                name="Pendapatan (Rp)"
                            />
                            <Area
                                type="monotone"
                                dataKey="orders"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fillOpacity={0.2}
                                fill="#3b82f6"
                                dot={{ fill: '#3b82f6', r: 4 }}
                                activeDot={{ r: 6, fill: '#2563eb' }}
                                name="Jumlah Pesanan"
                                yAxisId="right"
                            />
                        </AreaChart>
                    ) : chartType === 'line' ? (
                        <LineChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#999"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                            <YAxis yAxisId="right" orientation="right" stroke="#999" style={{ fontSize: '12px' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#ef4444"
                                strokeWidth={3}
                                dot={{ fill: '#ef4444', r: 5 }}
                                activeDot={{ r: 7, fill: '#dc2626' }}
                                name="Pendapatan (Rp)"
                                isAnimationActive={true}
                            />
                            <Line
                                type="monotone"
                                dataKey="orders"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: '#3b82f6', r: 4 }}
                                activeDot={{ r: 6, fill: '#2563eb' }}
                                name="Jumlah Pesanan"
                                yAxisId="right"
                            />
                        </LineChart>
                    ) : (
                        <ComposedChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#999"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                            <YAxis yAxisId="right" orientation="right" stroke="#999" style={{ fontSize: '12px' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar
                                dataKey="revenue"
                                fill="#ef4444"
                                opacity={0.7}
                                name="Pendapatan (Rp)"
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="orders"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: '#3b82f6', r: 4 }}
                                name="Jumlah Pesanan"
                            />
                        </ComposedChart>
                    )}
                </ResponsiveContainer>
            </div>

            {/* Stats Footer */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 dark:border-gray-700/50">
                <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</p>
                    <p className="font-bold text-red-600 dark:text-red-400">
                        Rp {stats.totalRevenue.toLocaleString('id-ID')}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Rata-rata</p>
                    <p className="font-bold text-blue-600 dark:text-blue-400">
                        Rp {stats.avgRevenue.toLocaleString('id-ID')}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Puncak</p>
                    <p className="font-bold text-green-600 dark:text-green-400">
                        Rp {stats.maxRevenue.toLocaleString('id-ID')}
                    </p>
                </div>
            </div>
        </div>
    );
}
