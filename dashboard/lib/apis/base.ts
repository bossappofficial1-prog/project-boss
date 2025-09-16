// Shared API utilities for BOSS Dashboard (used by all API categories)

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1234/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

// Get auth token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Create headers with auth token
export const createHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Generic API call function
export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...createHeaders(),
      ...options.headers,
    },
  });

  // Try to parse JSON body for success or error messages
  const text = await response.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // ignore JSON parse errors
  }

  if (!response.ok) {
    // Prefer backend-provided message if available
    const backendMessage = parsed?.message || parsed?.data?.message || parsed?.error || parsed?.errors || null;
    const message = backendMessage ? (typeof backendMessage === 'string' ? backendMessage : JSON.stringify(backendMessage)) : `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  const result: ApiResponse<T> = parsed as ApiResponse<T>;
  if (!result) {
    throw new Error('Invalid API response');
  }

  if (!result.success) {
    throw new Error(result.message || 'API call failed');
  }

  return result.data;
}
