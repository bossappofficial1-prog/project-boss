'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    FileText,
    Download,
    Calendar,
    DollarSign,
    TrendingUp,
    TrendingDown,
    BarChart3,
    PieChart,
    Receipt,
    CreditCard,
    Building2,
    Users,
    Filter,
    RefreshCw
} from 'lucide-react';

interface FinancialReport {
    id: string;
    type: 'revenue' | 'transactions' | 'business' | 'user';
    period: string;
    totalAmount: number;
    totalTransactions: number;
    generatedAt: string;
    status: 'completed' | 'processing' | 'failed';
}

interface RevenueReport {
    period: string;
    totalRevenue: number;
    totalTransactions: number;
    averageTransaction: number;
    growth: number;
}

interface BusinessReport {
    businessId: string;
    businessName: string;
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    commission: number;
}

export default function AdminReports() {
    const [reportType, setReportType] = useState('revenue');
    const [period, setPeriod] = useState('monthly');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [businessFilter, setBusinessFilter] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1234/api/v1';

    // Fetch financial reports list
    const { data: reportsData, isLoading: reportsLoading } = useQuery({
        queryKey: ['financial-reports', page, limit],
        queryFn: async () => {
            const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
            const response = await fetch(`${API_BASE_URL}/admin/reports?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch reports');
            return response.json();
        },
    });

    // Fetch revenue report data
    const { data: revenueReport, isLoading: revenueLoading } = useQuery({
        queryKey: ['revenue-report', period, startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams({ period });
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await fetch(`${API_BASE_URL}/admin/reports/revenue?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch revenue report');
            return response.json();
        },
    });

    // Fetch business performance report
    const { data: businessReport, isLoading: businessLoading } = useQuery({
        queryKey: ['business-report', period, startDate, endDate, businessFilter],
        queryFn: async () => {
            const params = new URLSearchParams({ period });
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (businessFilter) params.append('businessId', businessFilter);

            const response = await fetch(`${API_BASE_URL}/admin/reports/business-performance?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch business report');
            return response.json();
        },
    });

    const pagination = reportsData?.data?.pagination;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
            case 'processing':
                return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
            case 'failed':
                return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const handleGenerateReport = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/reports/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    type: reportType,
                    period,
                    startDate,
                    endDate,
                    businessId: businessFilter || undefined,
                }),
            });

            if (!response.ok) throw new Error('Failed to generate report');

            // Refresh reports list
            window.location.reload();
        } catch (error) {
            console.error('Failed to generate report:', error);
        }
    };

    const handleDownloadReport = async (reportId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/reports/${reportId}/download`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) throw new Error('Failed to download report');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report-${reportId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download report:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
                    <p className="text-gray-600 mt-1">Comprehensive financial reporting and analytics</p>
                </div>
                <div className="flex space-x-3">
                    <Button variant="outline" className="flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                    </Button>
                    <Button onClick={handleGenerateReport} className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>Generate Report</span>
                    </Button>
                </div>
            </div>

            {/* Report Generation Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Report Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                            <Select value={reportType} onValueChange={setReportType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="revenue">Revenue Report</SelectItem>
                                    <SelectItem value="transactions">Transaction Report</SelectItem>
                                    <SelectItem value="business">Business Performance</SelectItem>
                                    <SelectItem value="user">User Activity</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                            <Select value={period} onValueChange={setPeriod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="quarterly">Quarterly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Revenue Overview */}
            {reportType === 'revenue' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {revenueLoading ? '...' : formatCurrency(revenueReport?.data?.totalRevenue || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {revenueReport?.data?.growth >= 0 ? '+' : ''}{revenueReport?.data?.growth || 0}% from last period
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {revenueLoading ? '...' : revenueReport?.data?.totalTransactions || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Transactions processed
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {revenueLoading ? '...' : formatCurrency(revenueReport?.data?.averageTransaction || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Per transaction
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                            {revenueReport?.data?.growth >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${revenueReport?.data?.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {revenueLoading ? '...' : `${revenueReport?.data?.growth >= 0 ? '+' : ''}${revenueReport?.data?.growth || 0}%`}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Month over month
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Business Performance Table */}
            {reportType === 'business' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Business Performance Report</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {businessLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Business Name</TableHead>
                                            <TableHead>Total Revenue</TableHead>
                                            <TableHead>Total Orders</TableHead>
                                            <TableHead>Average Order Value</TableHead>
                                            <TableHead>Commission</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {businessReport?.data?.map((business: BusinessReport) => (
                                            <TableRow key={business.businessId}>
                                                <TableCell className="font-medium">{business.businessName}</TableCell>
                                                <TableCell>{formatCurrency(business.totalRevenue)}</TableCell>
                                                <TableCell>{business.totalOrders}</TableCell>
                                                <TableCell>{formatCurrency(business.averageOrderValue)}</TableCell>
                                                <TableCell>{formatCurrency(business.commission)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Generated Reports History */}
            <Card>
                <CardHeader>
                    <CardTitle>Report History</CardTitle>
                </CardHeader>
                <CardContent>
                    {reportsLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Report Type</TableHead>
                                        <TableHead>Period</TableHead>
                                        <TableHead>Total Amount</TableHead>
                                        <TableHead>Transactions</TableHead>
                                        <TableHead>Generated At</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportsData?.data?.reports?.map((report: FinancialReport) => (
                                        <TableRow key={report.id}>
                                            <TableCell className="font-medium capitalize">{report.type}</TableCell>
                                            <TableCell>{report.period}</TableCell>
                                            <TableCell>{formatCurrency(report.totalAmount)}</TableCell>
                                            <TableCell>{report.totalTransactions}</TableCell>
                                            <TableCell>{formatDate(report.generatedAt)}</TableCell>
                                            <TableCell>{getStatusBadge(report.status)}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownloadReport(report.id)}
                                                    disabled={report.status !== 'completed'}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <div className="text-sm text-gray-600">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} reports
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                                    disabled={page === pagination.totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}