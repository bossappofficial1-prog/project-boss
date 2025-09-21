import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
    path: string;
}

export interface ApiError {
    message: string;
    status?: number;
    code?: string;
}

// Dashboard specific types
export interface DashboardMetrics {
    totalUsers: number;
    totalBusinesses: number;
    totalRevenue: number;
    totalOrders?: number;
    totalProducts?: number;
    totalServices?: number;
}

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

export interface DashboardOverviewResponse {
    metrics: DashboardMetrics;
    recentActivities: RecentActivity[];
}

export interface RecentActivity {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
}

// Axios Service Class
class ApiService {
    private axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1234/api/v1',
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true, // Include cookies in requests
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request interceptor
        this.axiosInstance.interceptors.request.use(
            (config) => {
                // No need to add Authorization header - cookies are sent automatically with withCredentials: true
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.axiosInstance.interceptors.response.use(
            (response: AxiosResponse<ApiResponse>) => {
                // Handle successful responses
                if (response.data && !response.data.success) {
                    throw new Error(response.data.message || 'API call failed');
                }
                return response;
            },
            (error: AxiosError) => {
                // Handle errors
                if (error.response?.data) {
                    const apiError = error.response.data as ApiResponse;
                    throw new Error(apiError.message || 'API call failed');
                } else if (error.request) {
                    throw new Error('Network error - please check your connection');
                } else {
                    throw new Error(error.message || 'An unexpected error occurred');
                }
            }
        );
    }

    // Generic GET request
    async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
        const response = await this.axiosInstance.get<ApiResponse<T>>(endpoint, { params });
        return response.data.data;
    }

    // Generic POST request
    async post<T = any>(endpoint: string, data?: any): Promise<T> {
        const response = await this.axiosInstance.post<ApiResponse<T>>(endpoint, data);
        return response.data.data;
    }

    // Generic PUT request
    async put<T = any>(endpoint: string, data?: any): Promise<T> {
        const response = await this.axiosInstance.put<ApiResponse<T>>(endpoint, data);
        return response.data.data;
    }

    // Generic DELETE request
    async delete<T = any>(endpoint: string): Promise<T> {
        const response = await this.axiosInstance.delete<ApiResponse<T>>(endpoint);
        return response.data.data;
    }

    // Get axios instance for advanced usage
    getInstance(): AxiosInstance {
        return this.axiosInstance;
    }
}

// Create singleton instance
export const apiService = new ApiService();

// Export types
export type { AxiosInstance, AxiosResponse, AxiosError };