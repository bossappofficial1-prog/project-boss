import { PaginatedResponse } from '@/types';
import { apiClient, API_BASE_URL } from './base';
import { Product } from '@/hooks/useProducts';
import { ProductItem } from '@/hooks/useProductsData';

export const productApi = {
  // File operations (using fetch for blob handling)
  bulkImport: async (outletId: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('outletId', outletId);

    const response = await apiClient.post('/products/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  exportTemplate: async (): Promise<Blob> => {
    const response = await apiClient.get('/products/template/import', {
      responseType: 'blob',
    });
    return response.data;
  },

  exportData: async (outletId: string, filters?: { type?: 'GOODS' | 'SERVICE'; search?: string; }): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString();
    const endpoint = `/products/export/${outletId}${qs ? `?${qs}` : ''}`;

    const response = await apiClient.get(endpoint, {
      responseType: 'blob',
    });
    return response.data;
  },

  uploadImport: async (formData: FormData): Promise<any> => {
    const response = await apiClient.post('/products/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // JSON operations (now using apiClient instead of fetch)
  getByOutlet: (outletId: string, params?: { page?: number; limit?: number; search?: string; type?: 'GOODS' | 'SERVICE'; status?: 'ACTIVE' | 'INACTIVE'; }, accessBy: string = 'OWNER'): Promise<PaginatedResponse<ProductItem>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('q', params.search);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.status) searchParams.append('status', params.status);
    searchParams.append("accessed", accessBy)
    const q = searchParams.toString();
    const endpoint = `/products/outlet/${outletId}${q ? `?${q}` : ''}`;
    return apiClient.get(endpoint).then(res => res.data);
  },

  getById: (productId: string) =>
    apiClient.get(`/products/${productId}`).then(res => res.data.data),

  create: (productData: { name: string; description?: string; costPrice: number; price: number; type: 'GOODS' | 'SERVICE'; quantity?: number; unit?: string; status?: 'ACTIVE' | 'INACTIVE'; serviceDurationMinutes?: number; image?: string; outletId: string; }) =>
    apiClient.post('/products', productData).then(res => res.data.data),

  update: (productId: string, productData: Partial<{ name: string; description?: string; costPrice: number; price: number; type: 'GOODS' | 'SERVICE'; quantity?: number; unit?: string; status: 'ACTIVE' | 'INACTIVE'; serviceDurationMinutes?: number; image?: string; }>) =>
    apiClient.patch(`/products/${productId}`, productData).then(res => res.data.data),

  delete: (productId: string) =>
    apiClient.delete(`/products/${productId}`).then(res => res.data),

  search: (query: string) =>
    apiClient.get(`/products/search?name=${encodeURIComponent(query)}`).then(res => res.data.data),

  confirmImport: (importData: { outletId: string; data: any[]; }) =>
    apiClient.post('/products/import/confirm', importData).then(res => res.data.data),

  updateStock: (productId: string, stockData: { type: 'adjustment' | 'add' | 'subtract'; quantity: number; reason: string; notes?: string; }) =>
    apiClient.patch(`/products/${productId}/stock`, stockData).then(res => res.data.data),
};
