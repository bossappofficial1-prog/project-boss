'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    BarChart3,
    TrendingUp,
    Users,
    DollarSign,
    Calendar,
    Download,
    Filter,
    RefreshCcw,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import { apiClient } from '@/lib/apis/base';
import { formatCurrency } from '@/lib/utils';

interface RevenueData {
    period: string;
    revenue: number;
    transactions: number;
}

interface PaymentMethodData {
    paymentMethod: string;
    _sum: { amount: number };
    _count: number;
}

interface TopBusiness {
    id: string;
    name: string;
    totalRevenue: number;
    totalOrders: number;
}

export default function AdminAnalytics() {
    const [period, setPeriod] = useState('monthly');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const { data: revenueData, isLoading: revenueLoading, refetch: refetchRevenue } = useQuery({
        queryKey: ['revenue-analytics', period, startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams({ period });
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await apiClient.get(`/admin/analytics/revenue?${params}`);
            return response.data.data;
        },
    });

    const { data: transactionData, isLoading: transactionLoading, refetch: refetchTransaction } = useQuery({
        queryKey: ['transaction-analytics', startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await apiClient.get(`/admin/analytics/transactions?${params}`);
            return response.data.data;
        },
    });

    const { data: insightsData, isLoading: insightsLoading, refetch: refetchInsights } = useQuery({
        queryKey: ['revenue-insights'],
        queryFn: async () => {
            const response = await apiClient.get('/admin/analytics/revenue/insights');
            return response.data.data;
        },
    });

    const revenueStats = revenueData;
    const transactionStats = transactionData;
    const insights = insightsData;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Analytics & Reports</h1>
                    <p className="text-muted-foreground text-sm mt-1">Comprehensive insights into your platform performance</p>
                </div>
                <div className="flex space-x-3">
                    <Button variant="outline" size="sm" className="flex items-center space-x-2" onClick={() => { refetchRevenue(); refetchTransaction(); refetchInsights(); }}>
                        <RefreshCcw className="w-4 h-4" />
                        <span>Refresh</span>
                    </Button>
                </div>
            </div>

            {/* Date Range Filter */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5" />
                        <span>Date Range</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium">Period:</label>
                            <Select value={period} onValueChange={setPeriod}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="daily">Daily</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium">Start Date:</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium">End Date:</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-40"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Stats from Insights */}
            {insights && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Revenue MTD</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(insights.summary.totalRevenue)}</div>
                            <p className="text-xs text-muted-foreground">
                                Net: {formatCurrency(insights.summary.netRevenue)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">MRR (Paid Subs)</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(insights.summary.mrr)}</div>
                            <p className="text-xs text-muted-foreground">
                                ARR {formatCurrency(insights.summary.arr)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Growth vs Prev.</CardTitle>
                            {insights.summary.revenueGrowth >= 0 ? (
                                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                            ) : (
                                <ArrowDownRight className="h-4 w-4 text-destructive" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${insights.summary.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                                {insights.summary.revenueGrowth >= 0 ? '+' : ''}{insights.summary.revenueGrowth.toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Churn {insights.summary.churnRate.toFixed(1)}%
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{insights.summary.activeSubscriptions}</div>
                            <p className="text-xs text-muted-foreground">
                                Avg order {formatCurrency(insights.summary.averageOrderValue)}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Revenue Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <DollarSign className="w-5 h-5" />
                            <span>Revenue by Period</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {revenueLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {revenueStats?.chartData?.map((item: RevenueData) => (
                                    <div key={item.period} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                        <div>
                                            <p className="font-medium">{item.period}</p>
                                            <p className="text-sm text-muted-foreground">{item.transactions} transactions</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-emerald-600">{formatCurrency(item.revenue)}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!revenueStats?.chartData || revenueStats.chartData.length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-8">No revenue data for this period.</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="w-5 h-5" />
                            <span>Payment Methods</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {revenueLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {insights?.paymentMethods?.map((item: PaymentMethodData & { percentage: number; transactionCount: number }) => (
                                    <div key={item.paymentMethod} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                        <div>
                                            <p className="font-medium capitalize">{item.paymentMethod}</p>
                                            <p className="text-sm text-muted-foreground">{item.transactionCount} transactions</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-primary">{formatCurrency(item.totalAmount)}</p>
                                            <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                                        </div>
                                    </div>
                                ))}
                                {(!insights?.paymentMethods || insights.paymentMethods.length === 0) && (
                                    <p className="text-sm text-muted-foreground text-center py-8">No payment data available.</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Transaction Analytics */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5" />
                        <span>Transaction Summary</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {transactionLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{transactionStats?.summary?.totalTransactions || 0}</p>
                                <p className="text-sm text-muted-foreground">Total Transactions</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-emerald-600">{transactionStats?.summary?.successfulTransactions || 0}</p>
                                <p className="text-sm text-muted-foreground">Successful</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-destructive">{transactionStats?.summary?.failedTransactions || 0}</p>
                                <p className="text-sm text-muted-foreground">Failed</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{transactionStats?.summary?.successRate?.toFixed(1) || 0}%</p>
                                <p className="text-sm text-muted-foreground">Success Rate</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Top Businesses */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Users className="w-5 h-5" />
                        <span>Top Performing Businesses</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {revenueLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {insights?.topBusinesses?.slice(0, 5).map((business: TopBusiness, index: number) => (
                                <div key={business.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full font-bold">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium">{business.name}</p>
                                            <p className="text-sm text-muted-foreground">{business.totalOrders} orders</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-600">{formatCurrency(business.totalRevenue)}</p>
                                    </div>
                                </div>
                            ))}
                            {(!insights?.topBusinesses || insights.topBusinesses.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-8">No business data available.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
