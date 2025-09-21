import { apiService, DashboardOverviewResponse, SystemHealth, DashboardMetrics } from './api.service';
import { RevenueChartResponse, RecentActivity } from '../types/api.types';

export class DashboardService {
    /**
     * Get dashboard overview data including metrics and system health
     */
    static async getDashboardOverview(): Promise<DashboardOverviewResponse> {
        return apiService.get<DashboardOverviewResponse>('/admin/dashboard/overview');
    }

    /**
     * Get system health status
     */
    static async getSystemHealth(): Promise<{ health: SystemHealth; metrics: DashboardMetrics }> {
        try {
            const response = await apiService.get<{ health: SystemHealth; metrics: DashboardMetrics }>('/admin/system/health');
            return response;
        } catch (error) {
            // Return default values if API fails
            return {
                health: {
                    status: 'unknown' as const,
                    uptime: 0,
                    memory: {
                        used: 0,
                        total: 0,
                        percentage: 0
                    },
                    cpu: {
                        usage: 0
                    },
                    database: {
                        status: 'disconnected' as const,
                        responseTime: 0
                    }
                },
                metrics: {
                    totalUsers: 0,
                    totalBusinesses: 0,
                    totalRevenue: 0
                }
            };
        }
    }

    /**
     * Get dashboard metrics only
     */
    static async getDashboardMetrics(): Promise<DashboardMetrics> {
        const response = await this.getDashboardOverview();
        return response.metrics;
    }

    /**
     * Get system health only
     */
    static async getHealthStatus(): Promise<SystemHealth> {
        const response = await this.getSystemHealth();
        return response.health;
    }

    /**
     * Refresh dashboard data (useful for manual refresh)
     */
    static async refreshDashboardData(): Promise<DashboardOverviewResponse> {
        // Force refresh by making fresh API calls
        return this.getDashboardOverview();
    }

    /**
     * Get business analytics data
     */
    static async getBusinessAnalytics(period: 'week' | 'month' | 'year' = 'month') {
        return apiService.get(`/admin/analytics/business?period=${period}`);
    }

    /**
     * Get user analytics data
     */
    static async getUserAnalytics(period: 'week' | 'month' | 'year' = 'month') {
        return apiService.get(`/admin/analytics/users?period=${period}`);
    }

    /**
     * Get revenue analytics data for charts
     */
    static async getRevenueAnalytics(period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<RevenueChartResponse> {
        return apiService.get<RevenueChartResponse>(`/admin/analytics/revenue-chart?period=${period}`);
    }

    /**
     * Get recent activities
     */
    static async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
        try {
            const response = await apiService.get<RecentActivity[]>(`/admin/activities/recent?limit=${limit}`);
            return response;
        } catch (error) {
            // Return empty array if API fails
            return [];
        }
    }

    /**
     * Get all activities with pagination and filters
     */
    static async getAllActivities(options: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        type?: string;
    } = {}): Promise<{ activities: RecentActivity[]; total: number; page: number; totalPages: number }> {
        const {
            page = 1,
            limit = 20,
            search = '',
            status = '',
            type = ''
        } = options;

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(search && { search }),
                ...(status && { status }),
                ...(type && { type })
            });

            const response = await apiService.get<{
                activities: RecentActivity[];
                total: number;
                page: number;
                totalPages: number
            }>(`/admin/activities?${params}`);

            return response;
        } catch (error) {
            // Return empty result if API fails
            return {
                activities: [],
                total: 0,
                page: 1,
                totalPages: 0
            };
        }
    }
}