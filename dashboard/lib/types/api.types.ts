// API Response Types for Dashboard
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
    path: string;
}

// Dashboard Metrics
export interface DashboardMetrics {
    totalUsers: number;
    totalBusinesses: number;
    totalRevenue: number;
    totalOrders?: number;
    totalProducts?: number;
    totalServices?: number;
    // Change percentages
    usersChange?: number;
    businessesChange?: number;
    revenueChange?: number;
}

// System Health
export interface SystemHealth {
    status: 'healthy' | 'warning' | 'unhealthy' | 'unknown';
    uptime: number;
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    cpu: {
        usage: number;
    };
    database: {
        status: 'connected' | 'disconnected';
        responseTime: number;
    };
}

// Dashboard Overview Response
export interface DashboardOverviewResponse {
    metrics: DashboardMetrics;
    recentActivities: RecentActivity[];
}

// Recent Activity
export interface RecentActivity {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
}

// Activity Types
export type ActivityType =
    | 'user_registration'
    | 'order_completed'
    | 'withdrawal_request'
    | 'system_alert'
    | 'business_created'
    | 'payment_received'
    | 'user_login'
    | 'error_occurred';

// Error Types
export interface ApiError {
    message: string;
    status?: number;
    code?: string;
    details?: Record<string, any>;
}

// Loading States
export interface LoadingState {
    dashboard: boolean;
    health: boolean;
    analytics: boolean;
}

// Query States
export interface QueryState<T> {
    data: T | null;
    isLoading: boolean;
    error: ApiError | null;
    refetch: () => void;
}

// Component Props Types
export interface DashboardCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: React.ComponentType<{ className?: string }>;
    isLoading?: boolean;
}

export interface ErrorAlertProps {
    error: ApiError;
    onRetry?: () => void;
    title?: string;
}

export interface LoadingSkeletonProps {
    className?: string;
    lines?: number;
}

// Analytics Types
export interface AnalyticsData {
    period: 'week' | 'month' | 'year';
    data: Array<{
        date: string;
        value: number;
        label?: string;
    }>;
}

export interface BusinessAnalytics extends AnalyticsData {
    businesses: Array<{
        id: string;
        name: string;
        revenue: number;
        orders: number;
        growth: number;
    }>;
}

export interface UserAnalytics extends AnalyticsData {
    users: Array<{
        id: string;
        name: string;
        registrationDate: string;
        status: 'active' | 'inactive';
    }>;
}

export interface RevenueAnalytics extends AnalyticsData {
    breakdown: {
        products: number;
        services: number;
        subscriptions: number;
    };
}

// Revenue Chart Data
export interface RevenueChartData {
    date: string;
    revenue: number;
    transactions: number;
    period: 'daily' | 'weekly' | 'monthly';
}

export interface RevenueChartSummary {
    totalRevenue: number;
    totalTransactions: number;
    averageRevenue: number;
    period: string;
}

export interface RevenueChartResponse {
    chartData: RevenueChartData[];
    summary: RevenueChartSummary;
}