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
    Filter
} from 'lucide-react';
import { apiCall, apiClient } from '@/lib/apis/base';
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


    // Fetch revenue analytics
    const { data: revenueData, isLoading: revenueLoading } = useQuery({
        queryKey: ['revenue-analytics', period, startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams({ period });
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await apiClient.get(`/admin/analytics/revenue?${params}`);
            if (response.status !== 200) throw new Error('Failed to fetch revenue analytics');
            return response.data;
        },
    });

    // Fetch transaction analytics
    const { data: transactionData, isLoading: transactionLoading } = useQuery({
        queryKey: ['transaction-analytics', startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await apiClient.get(`/admin/analytics/transactions?${params}`);
            if (response.status !== 200) throw new Error('Failed to fetch transaction analytics');
            return response.data
        },
    });

    const revenueStats = revenueData?.data;
    const transactionStats = transactionData?.data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
                    <p className="text-gray-600 mt-1">Comprehensive insights into your platform performance</p>
                </div>
                <div className="flex space-x-3">
                    <Button variant="secondary" className="flex items-center space-x-2">
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                    </Button>
                    <Button variant="secondary" className="flex items-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>Export</span>
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
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {revenueStats?.revenueByPeriod?.map((item: RevenueData) => (
                                    <div key={item.period} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium">{item.period}</p>
                                            <p className="text-sm text-gray-600">{item.transactions} transactions</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600">{formatCurrency(item.revenue)}</p>
                                        </div>
                                    </div>
                                ))}
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
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {revenueStats?.revenueByPaymentMethod?.map((item: PaymentMethodData) => (
                                    <div key={item.paymentMethod} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium capitalize">{item.paymentMethod}</p>
                                            <p className="text-sm text-gray-600">{item._count} transactions</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-blue-600">{formatCurrency(item._sum.amount)}</p>
                                        </div>
                                    </div>
                                ))}
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
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">{transactionStats?.summary?.totalTransactions || 0}</p>
                                <p className="text-sm text-gray-600">Total Transactions</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{transactionStats?.summary?.successfulTransactions || 0}</p>
                                <p className="text-sm text-gray-600">Successful</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{transactionStats?.summary?.failedTransactions || 0}</p>
                                <p className="text-sm text-gray-600">Failed</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{transactionStats?.summary?.successRate?.toFixed(1) || 0}%</p>
                                <p className="text-sm text-gray-600">Success Rate</p>
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
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {revenueStats?.topBusinesses?.slice(0, 5).map((business: TopBusiness, index: number) => (
                                <div key={business.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center justify-center w-8 h-8 bg-red-100 text-red-600 rounded-full font-bold">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium">{business.name}</p>
                                            <p className="text-sm text-gray-600">{business.totalOrders} orders</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">{formatCurrency(business.totalRevenue)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}