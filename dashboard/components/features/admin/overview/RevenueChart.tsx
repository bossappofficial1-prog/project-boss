'use client'

import { formatCurrencyIDR } from "@/components/owner/dashboard/StatsCards"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminOverviewRevenueResponse } from "@/hooks/useOverview"
import { BarChart } from "lucide-react"
import { useState, useEffect } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface DateRange {
    from: string; // ISO string
    to: string;   // ISO string
}

interface RevenueChartProps {
    data: AdminOverviewRevenueResponse[]
    // Called when filter changes (or on mount). Passes current period range and previous period range.
    onFilterChange?: (currentRange: DateRange, previousRange: DateRange) => void
}

export const filterRevenue = [
    { key: '1d', value: '1D' },
    { key: '1w', value: '1W' },
    { key: '1m', value: '1M' },
    { key: 'ytd', value: 'YTD' },
    { key: '1y', value: '1Y' },
] as const

// Helper: start of day (local) and end of day
const startOfDay = (d: Date) => {
    const n = new Date(d);
    n.setHours(0, 0, 0, 0);
    return n;
};
const endOfDay = (d: Date) => {
    const n = new Date(d);
    n.setHours(23, 59, 59, 999);
    return n;
};


// Compute current and previous ranges based on selected filter
const computeRanges = (f: filterRevenueType) => {
    const now = new Date();
    let currentFrom: Date, currentTo: Date, prevFrom: Date, prevTo: Date;

    switch (f) {
        case '1d': {
            currentFrom = startOfDay(now);
            currentTo = endOfDay(now);
            const prevDay = new Date(currentFrom);
            prevDay.setDate(prevDay.getDate() - 1);
            prevFrom = startOfDay(prevDay);
            prevTo = endOfDay(prevDay);
            break;
        }
        case '1w': {
            // last 7 days including today
            currentTo = endOfDay(now);
            currentFrom = startOfDay(new Date(now.getTime()));
            currentFrom.setDate(currentFrom.getDate() - 6);

            // previous 7-day period immediately before currentFrom
            prevTo = startOfDay(currentFrom);
            prevTo = endOfDay(new Date(prevTo.getTime() - 1));
            prevFrom = startOfDay(new Date(prevTo.getTime()));
            prevFrom.setDate(prevFrom.getDate() - 6);
            break;
        }
        case '1m': {
            // last 30 days including today
            currentTo = endOfDay(now);
            currentFrom = startOfDay(new Date(now.getTime()));
            currentFrom.setDate(currentFrom.getDate() - 29);

            prevTo = startOfDay(currentFrom);
            prevTo = endOfDay(new Date(prevTo.getTime() - 1));
            prevFrom = startOfDay(new Date(prevTo.getTime()));
            prevFrom.setDate(prevFrom.getDate() - 29);
            break;
        }
        case 'ytd': {
            // year-to-date: from Jan 1st of current year to today
            currentFrom = startOfDay(new Date(now.getFullYear(), 0, 1));
            currentTo = endOfDay(now);

            // previous period: same range in previous year
            prevFrom = startOfDay(new Date(now.getFullYear() - 1, 0, 1));
            prevTo = endOfDay(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));
            break;
        }
        case '1y': {
            // last 12 months (365 days) including today
            currentTo = endOfDay(now);
            currentFrom = startOfDay(new Date(now.getTime()));
            currentFrom.setDate(currentFrom.getDate() - 364);

            prevTo = startOfDay(currentFrom);
            prevTo = endOfDay(new Date(prevTo.getTime() - 1));
            prevFrom = startOfDay(new Date(prevTo.getTime()));
            prevFrom.setDate(prevFrom.getDate() - 364);
            break;
        }
        default: {
            currentFrom = startOfDay(now);
            currentTo = endOfDay(now);
            const prevDay = new Date(currentFrom);
            prevDay.setDate(prevDay.getDate() - 1);
            prevFrom = startOfDay(prevDay);
            prevTo = endOfDay(prevDay);
        }
    }

    return {
        currentRange: { from: currentFrom.toISOString(), to: currentTo.toISOString() },
        previousRange: { from: prevFrom.toISOString(), to: prevTo.toISOString() },
    };
};

export type filterRevenueType = (typeof filterRevenue)[number]['key']

export function RevenueChart({ data, onFilterChange }: RevenueChartProps) {
    const [filter, setFilter] = useState<filterRevenueType>('1d');

    useEffect(() => {
        const ranges = computeRanges(filter);
        onFilterChange?.(ranges.currentRange, ranges.previousRange);
    }, [filter]);


    return (
        <Card className="col-span-4 shadow-md rounded-md border-border/50">
            <CardHeader>
                <CardTitle>Tren Pendapatan</CardTitle>
                <CardDescription className="gap-3 md:flex md:justify-between md:items-center">
                    <span>Performa pendapatan Anda selama 7 bulan terakhir.</span>
                    <Tabs
                        value={filter}
                        onValueChange={(cValue) => setFilter(cValue as filterRevenueType)}
                    >
                        <TabsList className="h-8 text-sm">
                            {filterRevenue.map((filter) => (
                                <TabsTrigger key={filter.key} value={filter.key}>{filter.value}</TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                    {data && data.length == 0
                        ? <div className="w-full h-full flex items-center justify-center">
                            <div className="max-w-xl w-full flex flex-col items-center gap-4 text-center">
                                <div className="flex items-center justify-center rounded-full bg-muted/40 w-20 h-20">
                                    <BarChart className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">Belum Ada Data</h3>
                            </div>
                        </div>
                        : <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => {
                                        return new Intl.NumberFormat("id-ID", { notation: "compact", compactDisplay: "short" }).format(value)
                                    }}
                                />
                                <Tooltip
                                    formatter={(value: number) => formatCurrencyIDR(value)}
                                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '6px' }}
                                    itemStyle={{ color: 'var(--card-foreground)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="var(--primary)"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    }
                </div>
            </CardContent>
        </Card>
    )
}