'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    TrendingUp,
    BarChart3,
    Settings,
    Users,
    Building2,
    DollarSign
} from 'lucide-react';
import { DashboardService } from '@/lib/services/dashboard.service';
import {
    DashboardCard,
    ErrorAlert,
    SystemHealthCard,
    RecentActivityCard,
    QuickActionsCard,
    RevenueChart
} from '@/components/dashboard';
import { DashboardMetrics, SystemHealth } from '@/lib/types/api.types';

export default function AdminDashboard() {
    const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

    // Fetch dashboard overview data
    const {
        data: dashboardData,
        isLoading: dashboardLoading,
        error: dashboardError,
        refetch: refetchDashboard
    } = useQuery({
        queryKey: ['admin-dashboard'],
        queryFn: DashboardService.getDashboardOverview,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    // Fetch system health
    const {
        data: systemHealth,
        isLoading: healthLoading,
        error: healthError,
        refetch: refetchHealth
    } = useQuery({
        queryKey: ['system-health'],
        queryFn: DashboardService.getSystemHealth,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    // Fetch revenue analytics
    const {
        data: revenueData,
        isLoading: revenueLoading,
        error: revenueError,
        refetch: refetchRevenue
    } = useQuery({
        queryKey: ['revenue-analytics', selectedPeriod],
        queryFn: () => DashboardService.getRevenueAnalytics(selectedPeriod),
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

    const stats: DashboardMetrics | null = dashboardData?.metrics || systemHealth?.metrics || null;
    const health: SystemHealth | null = systemHealth?.health || null;

    // Use recent activities from dashboard overview, fallback to separate call
    const recentActivities = dashboardData?.recentActivities || [];

    return (
        <div className="space-y-6">
            {/* Error Messages */}
            {(dashboardError || healthError) && (
                <div className="space-y-4">
                    {dashboardError && (
                        <ErrorAlert
                            error={{ message: dashboardError.message || 'Failed to load dashboard data' }}
                            onRetry={refetchDashboard}
                            title="Error Loading Dashboard Data"
                        />
                    )}
                    {healthError && (
                        <ErrorAlert
                            error={{ message: healthError.message || 'Failed to load system health' }}
                            onRetry={refetchHealth}
                            title="Error Loading System Health"
                        />
                    )}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard Overview</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back! Here's what's happening with your platform.</p>
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
                <DashboardCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    change={stats?.usersChange !== undefined
                        ? `${stats.usersChange >= 0 ? '+' : ''}${stats.usersChange.toFixed(1)}% from last month`
                        : "+12% from last month"
                    }
                    icon={Users}
                    isLoading={dashboardLoading || healthLoading}
                />

                <DashboardCard
                    title="Total Businesses"
                    value={stats?.totalBusinesses || 0}
                    change={stats?.businessesChange !== undefined
                        ? `${stats.businessesChange >= 0 ? '+' : ''}${stats.businessesChange.toFixed(1)}% from last month`
                        : "+8% from last month"
                    }
                    icon={Building2}
                    isLoading={dashboardLoading || healthLoading}
                />

                <DashboardCard
                    title="Total Revenue"
                    value={`Rp ${stats?.totalRevenue?.toLocaleString() || 0}`}
                    change={stats?.revenueChange !== undefined
                        ? `${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange.toFixed(1)}% from last month`
                        : "+15% from last month"
                    }
                    icon={DollarSign}
                    isLoading={dashboardLoading || healthLoading}
                />

                <SystemHealthCard
                    health={health}
                    isLoading={healthLoading}
                />
            </div>

            {/* Charts and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueChart
                    data={revenueData?.chartData || []}
                    summary={revenueData?.summary || {
                        totalRevenue: 0,
                        totalTransactions: 0,
                        averageRevenue: 0,
                        period: selectedPeriod
                    }}
                    isLoading={revenueLoading}
                    error={revenueError?.message}
                    onPeriodChange={setSelectedPeriod}
                />

                {/* Recent Activity */}
                <RecentActivityCard
                    activities={recentActivities}
                    isLoading={dashboardLoading}
                />
            </div>

            {/* Quick Actions */}
            <QuickActionsCard />
        </div>
    );
}