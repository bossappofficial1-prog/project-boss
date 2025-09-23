import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { TrendingUp, DollarSign, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { RevenueChartData, RevenueChartSummary } from '@/lib/types/api.types';
import { formatCurrency, formatChartDate } from '@/lib/utils';

interface RevenueChartProps {
    data: RevenueChartData[];
    summary: RevenueChartSummary;
    isLoading?: boolean;
    error?: string;
    onPeriodChange?: (period: 'daily' | 'weekly' | 'monthly') => void;
}

export function RevenueChart({ data, summary, isLoading, error, onPeriodChange }: RevenueChartProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');

    const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly') => {
        setSelectedPeriod(period);
        onPeriodChange?.(period);
    };

    // Wrapper function for Recharts tickFormatter
    const formatYAxisTick = (value: number) => formatCurrency(value);

    // Wrapper function for date formatting
    const formatXAxisTick = (dateString: string) => formatChartDate(dateString, selectedPeriod);

    // Chart configuration for shadcn
    const chartConfig = {
        revenue: {
            label: " Revenue",
            color: "var(--chart-1)",
        },
    };

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        <span>Revenue Analytics</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="text-red-500 mb-2">⚠️</div>
                            <p className="text-sm text-muted-foreground">{error}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        <span>Revenue Analytics</span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {/* Period Selection */}
                        <div className="flex rounded-lg border p-1">
                            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                                <Button
                                    key={period}
                                    variant={selectedPeriod === period ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => handlePeriodChange(period)}
                                    className="px-3 py-1 text-xs capitalize"
                                >
                                    {period}
                                </Button>
                            ))}
                        </div>

                        {/* Chart Type Toggle */}
                        <div className="flex rounded-lg border p-1">
                            <Button
                                variant={chartType === 'line' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setChartType('line')}
                                className="px-2 py-1"
                            >
                                <LineChartIcon className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={chartType === 'bar' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setChartType('bar')}
                                className="px-2 py-1"
                            >
                                <BarChart3 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                            <p className="text-xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                            <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                            <p className="text-xl font-bold">{summary.totalTransactions.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                        <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
                            <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Average Revenue</p>
                            <p className="text-xl font-bold">{formatCurrency(summary.averageRevenue)}</p>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-80">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                <p className="text-sm text-muted-foreground">Loading chart data...</p>
                            </div>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">No data available for the selected period</p>
                            </div>
                        </div>
                    ) : (
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            {chartType === 'line' ? (
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatXAxisTick}
                                        fontSize={12}
                                    />
                                    <YAxis
                                        tickFormatter={formatYAxisTick}
                                        fontSize={12}
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                formatter={(value, name) => [
                                                    formatCurrency(value as number),
                                                    chartConfig[name as keyof typeof chartConfig]?.label || name
                                                ]}
                                                labelFormatter={(label) => formatXAxisTick(label)}
                                            />
                                        }
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="var(--color-revenue)"
                                        strokeWidth={3}
                                        dot={{ fill: "var(--color-revenue)", strokeWidth: 2, r: 5 }}
                                        activeDot={{ r: 7, stroke: "var(--color-revenue)", strokeWidth: 2, fill: "var(--background)" }}
                                    />
                                </LineChart>
                            ) : (
                                <BarChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatXAxisTick}
                                        fontSize={12}
                                    />
                                    <YAxis
                                        tickFormatter={formatYAxisTick}
                                        fontSize={12}
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                formatter={(value, name) => [
                                                    formatCurrency(value as number),
                                                    chartConfig[name as keyof typeof chartConfig]?.label || name
                                                ]}
                                                labelFormatter={(label) => formatXAxisTick(label)}
                                            />
                                        }
                                    />
                                    <Bar
                                        dataKey="revenue"
                                        fill="var(--color-revenue)"
                                        radius={[4, 4, 0, 0]}
                                        stroke="var(--color-revenue)"
                                        strokeWidth={1}
                                    />
                                </BarChart>
                            )}
                        </ChartContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}