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
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
});

// Request interceptor (removed auth token logic since using httpOnly cookies)
apiClient.interceptors.request.use(
  (config) => {
    // No need to add Authorization header - cookies are sent automatically with withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.data) {
      const backendMessage = error.response.data?.message ||
        error.response.data?.data?.message ||
        error.response.data?.error ||
        error.response.data?.errors ||
        null;
      const message = backendMessage ?
        (typeof backendMessage === 'string' ? backendMessage : JSON.stringify(backendMessage)) :
        `${error.response.status} ${error.response.statusText}`;
      throw new Error(message);
    }
    throw error;
  }
);

// Get auth token from cookies (deprecated - using httpOnly cookies now)
export const getAuthToken = (): string | null => {
  // Token is now stored in httpOnly cookies, not accessible from JavaScript
  // This function is kept for backward compatibility but returns null
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
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...createHeaders(),
      ...options.headers,
    },
  });

  const text = await response.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // ignore JSON parse errors
  }

  if (!response.ok) {
    const backendMessage = parsed?.message || parsed?.data?.message || parsed?.error || parsed?.errors || null;
    const message = backendMessage ? (typeof backendMessage === 'string' ? backendMessage : JSON.stringify(backendMessage)) : `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  const result: ApiResponse<T[]> & { 
    pagination?: { 
      page: number; 
      limit: number; 
      total: number; 
      totalPages: number; 
    } 
  } = parsed;

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
