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
import { TimeframeFilter } from '@/types/outlet';
import { subDays, subMonths } from 'date-fns';
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

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 text-xs shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
            <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                {label}
            </p>
            {payload.map((entry) => (
                <p key={entry.name} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="font-medium">{entry.name}:</span>
                    <span>{entry.value.toLocaleString('id-ID')}</span>
                </p>
            ))}
        </div>
    );
};

export default function RevenueChart({ data }: RevenueChartProps) {
    const [timeframe, setTimeframe] = useState<TimeframeFilter>('30d');
    const [chartType, setChartType] = useState<'area' | 'line' | 'composed'>('area');

    const gradientId = 'revenueGradient';

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

    const frameButtonClass = (isActive: boolean) =>
        isActive
            ? 'bg-slate-900 text-white shadow-sm hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-100'
            : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white';

    const chartButtonClass = (isActive: boolean) =>
        isActive
            ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-500'
            : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white';

    const isEmpty = filteredData.length === 0;

    const renderChart = () => {
        if (chartType === 'area') {
            return (
                <AreaChart data={filteredData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        tickMargin={8}
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis stroke="#64748b" tickMargin={8} style={{ fontSize: '12px' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" tickMargin={8} style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Legend wrapperStyle={{ paddingTop: 12 }} />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill={`url(#${gradientId})`}
                        dot={{ fill: '#ef4444', r: 4 }}
                        activeDot={{ r: 6, fill: '#dc2626' }}
                        name="Pendapatan (Rp)"
                    />
                    <Area
                        type="monotone"
                        dataKey="orders"
                        stroke="#2563eb"
                        strokeWidth={2}
                        fillOpacity={0.1}
                        fill="#2563eb"
                        dot={{ fill: '#2563eb', r: 4 }}
                        activeDot={{ r: 6, fill: '#1d4ed8' }}
                        name="Jumlah Pesanan"
                        yAxisId="right"
                    />
                </AreaChart>
            );
        }

        if (chartType === 'line') {
            return (
                <LineChart data={filteredData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        tickMargin={8}
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis stroke="#64748b" tickMargin={8} style={{ fontSize: '12px' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" tickMargin={8} style={{ fontSize: '12px' }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Legend wrapperStyle={{ paddingTop: 12 }} />
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#ef4444"
                        strokeWidth={2.5}
                        dot={{ fill: '#ef4444', r: 4 }}
                        activeDot={{ r: 6, fill: '#dc2626' }}
                        name="Pendapatan (Rp)"
                    />
                    <Line
                        type="monotone"
                        dataKey="orders"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ fill: '#2563eb', r: 3.5 }}
                        activeDot={{ r: 6, fill: '#1d4ed8' }}
                        name="Jumlah Pesanan"
                        yAxisId="right"
                    />
                </LineChart>
            );
        }

        return (
            <ComposedChart data={filteredData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" vertical={false} />
                <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tickMargin={8}
                    style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#64748b" tickMargin={8} style={{ fontSize: '12px' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" tickMargin={8} style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Legend wrapperStyle={{ paddingTop: 12 }} />
                <Bar dataKey="revenue" fill="#ef4444" radius={[6, 6, 0, 0]} name="Pendapatan (Rp)" />
                <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: '#2563eb', r: 4 }}
                    name="Jumlah Pesanan"
                />
            </ComposedChart>
        );
    };

    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg transition dark:border-slate-800/70 dark:bg-slate-950">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                        Tren Pendapatan
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Total {stats.totalRevenue.toLocaleString('id-ID')} • Rata-rata {stats.avgRevenue.toLocaleString('id-ID')} • Puncak {stats.maxRevenue.toLocaleString('id-ID')}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <div className="flex gap-2">
                        {timeframeOptions.map((option) => {
                            const isActive = timeframe === option.value;
                            return (
                                <Button
                                    key={option.value}
                                    size="sm"
                                    variant={isActive ? 'default' : 'outline'}
                                    onClick={() => setTimeframe(option.value)}
                                    className={`rounded-full px-3 font-medium transition ${frameButtonClass(isActive)}`}
                                >
                                    {option.label}
                                </Button>
                            );
                        })}
                    </div>

                    <div className="flex gap-2">
                        {(['area', 'line', 'composed'] as const).map((type) => {
                            const isActive = chartType === type;
                            return (
                                <Button
                                    key={type}
                                    size="sm"
                                    variant={isActive ? 'default' : 'outline'}
                                    onClick={() => setChartType(type)}
                                    className={`rounded-full px-3 capitalize transition ${chartButtonClass(isActive)}`}
                                >
                                    {type}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="w-full">
                {isEmpty ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                        <span className="font-medium">Belum ada data tren untuk rentang ini</span>
                        <span className="text-xs">Pilih rentang tanggal berbeda atau tunggu transaksi baru</span>
                    </div>
                ) : (
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            {renderChart()}
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div className="mt-6 grid gap-4 border-t border-slate-200 pt-4 text-center text-sm dark:border-slate-800 md:grid-cols-3">
                <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        Rp {stats.totalRevenue.toLocaleString('id-ID')}
                    </p>
                </div>
                <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Rata-rata</p>
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        Rp {stats.avgRevenue.toLocaleString('id-ID')}
                    </p>
                </div>
                <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Puncak</p>
                    <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                        Rp {stats.maxRevenue.toLocaleString('id-ID')}
                    </p>
                </div>
            </div>
        </div>
    );
}
