'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    Building2,
    DollarSign,
    TrendingUp,
    Activity,
    AlertCircle,
    CheckCircle,
    Clock,
    BarChart3,
    PieChart,
    Settings
} from 'lucide-react';

interface RecentActivity {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
}

export default function AdminDashboard() {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1234/api/v1';

    // Fetch dashboard overview data
    const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
        queryKey: ['admin-dashboard'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/admin/dashboard/overview`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch dashboard data');
            return response.json();
        },
    });

    // Fetch system health
    const { data: systemHealth, isLoading: healthLoading } = useQuery({
        queryKey: ['system-health'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/admin/system/health`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch system health');
            return response.json();
        },
    });

    const stats = systemHealth?.data?.metrics;
    const health = systemHealth?.data;

    const recentActivities: RecentActivity[] = [
        {
            id: '1',
            type: 'user_registration',
            description: 'New business owner registered',
            timestamp: '2 minutes ago',
            status: 'success'
        },
        {
            id: '2',
            type: 'order_completed',
            description: 'Order #1234 completed successfully',
            timestamp: '5 minutes ago',
            status: 'success'
        },
        {
            id: '3',
            type: 'withdrawal_request',
            description: 'Withdrawal request pending approval',
            timestamp: '10 minutes ago',
            status: 'warning'
        },
        {
            id: '4',
            type: 'system_alert',
            description: 'High server load detected',
            timestamp: '15 minutes ago',
            status: 'error'
        }
    ];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'warning':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Activity className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'healthy':
                return <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>;
            case 'warning':
                return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
            case 'unhealthy':
                return <Badge variant="default" className="bg-red-100 text-red-800">Unhealthy</Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your platform.</p>
                </div>
                <div className="flex space-x-3">
                    <Button variant="outline" className="flex items-center space-x-2">
                        <BarChart3 className="w-4 h-4" />
                        <span>View Reports</span>
                    </Button>
                    <Button className="flex items-center space-x-2">
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {dashboardLoading ? '...' : stats?.totalUsers || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            +12% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {dashboardLoading ? '...' : stats?.totalBusinesses || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            +8% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {dashboardLoading ? '...' : `Rp ${stats?.totalRevenue?.toLocaleString() || 0}`}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            +15% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Health</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            {healthLoading ? (
                                <div className="text-2xl font-bold">...</div>
                            ) : (
                                <>
                                    {getStatusBadge(health?.health)}
                                </>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            All systems operational
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart Placeholder */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <TrendingUp className="w-5 h-5" />
                            <span>Revenue Trends</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                            <div className="text-center">
                                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500">Revenue chart will be displayed here</p>
                                <Button variant="outline" size="sm" className="mt-2">
                                    View Analytics
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Activity className="w-5 h-5" />
                            <span>Recent Activity</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentActivities.map((activity) => (
                                <div key={activity.id} className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        {getStatusIcon(activity.status)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">
                                            {activity.description}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {activity.timestamp}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <Button variant="outline" size="sm" className="w-full">
                                View All Activity
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
                            <Users className="w-6 h-6" />
                            <span className="text-sm">Manage Users</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
                            <Building2 className="w-6 h-6" />
                            <span className="text-sm">Business Review</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
                            <PieChart className="w-6 h-6" />
                            <span className="text-sm">View Reports</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col items-center space-y-2">
                            <Settings className="w-6 h-6" />
                            <span className="text-sm">System Settings</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}