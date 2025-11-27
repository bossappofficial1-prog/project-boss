// API Services (existing)
export { apiService } from './api.service';
export { DashboardService } from './dashboard.service';

// New Pattern Services
export { BaseService } from './BaseService';
export { userService } from './UserService';

// Tambahkan service lain di sini saat sudah dibuat:
// export { productService } from './ProductService';
// export { orderService } from './OrderService';
// export { outletService } from './OutletService';

// Types
export type {
    ApiResponse,
    ApiError,
    DashboardMetrics,
    SystemHealth,
    DashboardOverviewResponse,
    RecentActivity,
    ActivityType,
    LoadingState,
    QueryState,
    DashboardCardProps,
    ErrorAlertProps,
    LoadingSkeletonProps,
    AnalyticsData,
    BusinessAnalytics,
    UserAnalytics,
    RevenueAnalytics,
    RevenueChartData,
    RevenueChartSummary,
    RevenueChartResponse
} from '../types/api.types';