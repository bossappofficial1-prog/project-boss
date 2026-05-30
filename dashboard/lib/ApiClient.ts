import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";

const AUTH_ROLE_SESSION_KEY = "auth-role";

const getAuthRoleHint = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  const pathname = window.location.pathname || "";

  if (pathname.startsWith("/admin")) return "ADMIN";
  if (pathname.startsWith("/owner")) return "OWNER";
  if (pathname.startsWith("/cashier")) return "CASHIER";
  if (pathname.startsWith("/manager")) return "MANAGER";

  try {
    const stored = sessionStorage.getItem(AUTH_ROLE_SESSION_KEY);
    return stored || undefined;
  } catch {
    return undefined;
  }
};

/**
 * Centralized API Client untuk semua HTTP requests
 *
 * Features:
 * - Automatic JWT token injection
 * - Global error handling
 * - Response data extraction
 * - Auto redirect ke login jika unauthorized
 *
 * @example
 * ```typescript
 * // GET request
 * const users = await apiClient.get<User[]>('/api/v1/users');
 *
 * // POST request
 * const newUser = await apiClient.post<User>('/api/v1/users', userData);
 * ```
 */
class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL:
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:1234/api/v1",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  /**
   * Setup request & response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - Inject JWT token
    this.instance.interceptors.request.use(
      (config) => {
        // Only add token in browser environment
        if (typeof window !== "undefined") {
          const roleHint = getAuthRoleHint();
          if (roleHint) {
            config.headers = config.headers ?? {};
            config.headers["X-Auth-Role"] = roleHint;
          }
          const token = localStorage.getItem("token");
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor - Handle errors globally
    this.instance.interceptors.response.use(
      (response) => {
        // Extract data from standard API response
        return response.data;
      },
      (error: AxiosError<any>) => {
        // Handle 401 Unauthorized - redirect to login
        if (error.response?.status === 401) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/auth/login";
          }
        }

        // Extract error message
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Terjadi kesalahan pada server";

        return Promise.reject({
          message: errorMessage,
          status: error.response?.status,
          data: error.response?.data,
        });
      },
    );
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get<T, T>(url, config);
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.instance.post<T, T>(url, data, config);
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.instance.put<T, T>(url, data, config);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.instance.patch<T, T>(url, data, config);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete<T, T>(url, config);
  }

  /**
   * Upload file with multipart/form-data
   */
  async upload<T = any>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void,
  ): Promise<T> {
    return this.instance.post<T, T>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
  }

  /**
   * Get axios instance for custom configurations
   */
  getAxiosInstance(): AxiosInstance {
    return this.instance;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing purposes
export { ApiClient };
