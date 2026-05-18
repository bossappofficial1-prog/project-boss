import { apiClient } from '../ApiClient';

/**
 * Response type untuk API responses dengan data wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Base query parameters untuk list operations
 */
export interface BaseQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any; // Allow additional filters
}

/**
 * Base Service Class dengan CRUD operations standar
 * 
 * Menghilangkan duplikasi kode service di setiap entity
 * 
 * @example
 * ```typescript
 * class UserService extends BaseService<User> {
 *   constructor() {
 *     super('/api/v1/users');
 *   }
 *   
 *   // Add custom methods
 *   async changeRole(userId: string, role: string) {
 *     return this.post(`${this.endpoint}/${userId}/role`, { role });
 *   }
 * }
 * 
 * export const userService = new UserService();
 * ```
 */
export class BaseService<T> {
  constructor(protected readonly endpoint: string) { }

  /**
   * Get list of entities dengan pagination & filters
   */
  async list(params?: BaseQueryParams): Promise<T[]> {
    const response = await apiClient.get<ApiResponse<T[]>>(
      this.endpoint,
      { params }
    );
    return response.data;
  }

  /**
   * Get list dengan paginated response
   */
  async listPaginated(params?: BaseQueryParams): Promise<PaginatedResponse<T>> {
    return apiClient.get<PaginatedResponse<T>>(this.endpoint, { params });
  }

  /**
   * Get single entity by ID
   */
  async getById(id: string): Promise<T> {
    const response = await apiClient.get<ApiResponse<T>>(`${this.endpoint}/${id}`);
    return response.data;
  }

  /**
   * Create new entity
   */
  async create(data: Partial<T>): Promise<T> {
    const response = await apiClient.post<ApiResponse<T>>(this.endpoint, data);
    return response.data;
  }

  /**
   * Update existing entity
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    const response = await apiClient.put<ApiResponse<T>>(
      `${this.endpoint}/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Partial update entity
   */
  async patch(id: string, data: Partial<T>): Promise<T> {
    const response = await apiClient.patch<ApiResponse<T>>(
      `${this.endpoint}/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.endpoint}/${id}`);
  }

  /**
   * Bulk delete entities
   */
  async bulkDelete(ids: string[]): Promise<void> {
    await apiClient.post(`${this.endpoint}/bulk-delete`, { ids });
  }

  /**
   * Helper method untuk custom GET requests
   */
  protected async get<R = any>(path: string, params?: any): Promise<R> {
    return apiClient.get<R>(`${this.endpoint}${path}`, { params });
  }

  /**
   * Helper method untuk custom POST requests
   */
  protected async post<R = any>(path: string, data?: any): Promise<R> {
    return apiClient.post<R>(`${this.endpoint}${path}`, data);
  }

  /**
   * Helper method untuk custom PUT requests
   */
  protected async put<R = any>(path: string, data?: any): Promise<R> {
    return apiClient.put<R>(`${this.endpoint}${path}`, data);
  }

  /**
   * Helper method untuk custom PATCH requests
   */
  protected async patchRequest<R = any>(path: string, data?: any): Promise<R> {
    return apiClient.patch<R>(`${this.endpoint}${path}`, data);
  }

  /**
   * Helper method untuk custom DELETE requests
   */
  protected async deleteRequest<R = any>(path: string): Promise<R> {
    return apiClient.delete<R>(`${this.endpoint}${path}`);
  }

  /**
   * Upload file untuk entity
   */
  async uploadFile(formData: FormData, onProgress?: (progress: number) => void): Promise<T> {
    const response = await apiClient.upload<ApiResponse<T>>(
      `${this.endpoint}/upload`,
      formData,
      onProgress
    );
    return response.data;
  }
}
