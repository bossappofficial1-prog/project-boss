// Shared API utilities for BOSS Dashboard (used by all API categories)
import axios, { AxiosInstance, AxiosResponse } from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1234/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

// Create axios instance with default configuration
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
});

// Request interceptor - cookies are sent automatically with withCredentials
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.log(error.response)
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (config) => {
    return config;
  },
  (error) => {
    const isInvalidLogin = error.response.data.message == "Anda belum login, silakan login terlebih dahulu";
    const redirectPath = typeof window !== 'undefined' ? window.location.pathname : '';

    if (isInvalidLogin) {
      window.location.href = `/auth/login?redirect=${redirectPath}`;
    }
    return Promise.reject(error);
  }
);

// Get auth token from cookies (deprecated - using httpOnly cookies now)
export const getAuthToken = (): string | null => {
  return null;
};

// Create headers with auth token (deprecated - using cookies now)
export const createHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };

  // No need to add Authorization header - cookies are sent automatically
  return headers;
};

// Generic API call function using axios (backward compatibility)
export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method as any) || 'GET';
  const data = options.body ? JSON.parse(options.body as string) : undefined;

  const response = await apiClient.request({
    url: endpoint,
    method,
    data,
  });

  const result: ApiResponse<T> = response.data as ApiResponse<T>;
  if (!result) {
    throw new Error('Invalid API response');
  }

  if (!result.success) {
    throw new Error(result.message || 'API call failed');
  }

  return result.data;
}

// Generic paginated API call function
export async function apiCallPaginated<T>(endpoint: string, options: RequestInit = {}): Promise<{
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}> {
  const method = (options.method as any) || 'GET';
  const data = options.body ? JSON.parse(options.body as string) : undefined;

  const response = await apiClient.request({
    url: endpoint,
    method,
    data,
  });

  const result: ApiResponse<T[]> & {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  } = response.data;

  if (!result) {
    throw new Error('Invalid API response');
  }

  if (!result.success) {
    throw new Error(result.message || 'API call failed');
  }

  // Handle the actual backend response structure
  return {
    data: result.data || [],
    page: result.pagination?.page || 1,
    limit: result.pagination?.limit || 20,
    total: result.pagination?.total || 0,
    totalPages: result.pagination?.totalPages || 1,
  };
}
