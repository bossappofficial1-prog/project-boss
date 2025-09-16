import { apiCall, API_BASE_URL, getAuthToken } from './base';

export const productApi = {
  getByOutlet: (outletId: string, params?: { page?: number; limit?: number; search?: string; }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('q', params.search);
    const qs = searchParams.toString();
    const endpoint = `/products/outlet/${outletId}${qs ? `?${qs}` : ''}`;
    return apiCall<{ products: Array<{ id: string; name: string; description?: string; costPrice: number; price: number; type: 'GOODS' | 'SERVICE'; quantity?: number; unit?: string; status: 'ACTIVE' | 'INACTIVE'; serviceDurationMinutes?: number; image?: string; createdAt: string; updatedAt: string; }>; pagination?: { page: number; limit: number; total: number; totalPages: number; }; }>(endpoint);
  },

  getById: (productId: string) => apiCall<{ id: string; name: string; description?: string; costPrice: number; price: number; type: 'GOODS' | 'SERVICE'; quantity?: number; unit?: string; status: 'ACTIVE' | 'INACTIVE'; serviceDurationMinutes?: number; image?: string; outletId: string; createdAt: string; updatedAt: string; }>(`/products/${productId}`),

  create: (productData: { name: string; description?: string; costPrice: number; price: number; type: 'GOODS' | 'SERVICE'; quantity?: number; unit?: string; status?: 'ACTIVE' | 'INACTIVE'; serviceDurationMinutes?: number; image?: string; outletId: string; }) =>
    apiCall<any>('/products', { method: 'POST', body: JSON.stringify(productData) }),

  update: (productId: string, productData: Partial<{ name: string; description?: string; costPrice: number; price: number; type: 'GOODS' | 'SERVICE'; quantity?: number; unit?: string; status: 'ACTIVE' | 'INACTIVE'; serviceDurationMinutes?: number; image?: string; }>) =>
    apiCall<any>(`/products/${productId}`, { method: 'PATCH', body: JSON.stringify(productData) }),

  delete: (productId: string) => apiCall<any>(`/products/${productId}`, { method: 'DELETE' }),

  search: (query: string) => apiCall<Array<{ id: string; name: string; description?: string; costPrice: number; price: number; type: 'GOODS' | 'SERVICE'; quantity?: number; unit?: string; status: 'ACTIVE' | 'INACTIVE'; image?: string; }>>(`/products/search?name=${encodeURIComponent(query)}`),

  bulkImport: async (outletId: string, file: File): Promise<any> => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('outletId', outletId);

    const response = await fetch(`${API_BASE_URL}/products/bulk`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) throw new Error('Import failed');
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Import failed');
    return result.data;
  },

  exportTemplate: async (): Promise<Blob> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/products/template/import`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!response.ok) throw new Error('Template download failed');
    return response.blob();
  },

  exportData: async (outletId: string, filters?: { type?: 'GOODS' | 'SERVICE'; search?: string; }): Promise<Blob> => {
    const token = getAuthToken();
    const searchParams = new URLSearchParams();
    if (filters?.type) searchParams.append('type', filters.type);
    if (filters?.search) searchParams.append('search', filters.search);
    const qs = searchParams.toString();
    const endpoint = `/products/export/${outletId}${qs ? `?${qs}` : ''}`;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!response.ok) { if (response.status === 404) throw new Error('Export endpoint not found (404)'); throw new Error(`Export failed with status ${response.status}`); }
    return response.blob();
  },

  uploadImport: async (formData: FormData): Promise<any> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/products/import/preview`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
    if (!response.ok) throw new Error('Import preview failed');
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Import preview failed');
    return result;
  },

  confirmImport: (importData: { outletId: string; data: any[]; }) => apiCall<any>('/products/import/confirm', { method: 'POST', body: JSON.stringify(importData) }),

  updateStock: (productId: string, stockData: { type: 'adjustment' | 'add' | 'subtract'; quantity: number; reason: string; notes?: string; }) =>
    apiCall<any>(`/products/${productId}/stock`, { method: 'PATCH', body: JSON.stringify(stockData) }),
};
