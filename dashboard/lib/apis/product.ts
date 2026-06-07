import { PaginatedResponse } from '@/types';
import { apiClient, API_BASE_URL } from './base';
import { Product } from '@/hooks/use-products';
import { ProductItem } from '@/hooks/use-products-data';
import type { PosV2Product } from './pos-v2';

export type CreateProductPayload = {
  name: string;
  description?: string;
  type: 'GOODS' | 'SERVICE' | 'TICKET';
  status: 'ACTIVE' | 'INACTIVE';
  categoryId?: string | null;
  taxPercentage?: number | null;
  taxName?: string;
  outletId: string;
  image?: string;
  goods?: {
    averageHpp: number;
    currentStock: number;
    sellingPrice: number;
    unit: string;
    minStock?: number | null;
    maxStock?: number | null;
    barcode?: string;
    sku?: string;
  };
  service?: {
    durationMinutes: number;
    sellingPrice: number;
    providerName: string;
    providerPhone?: string;
    providerEmail?: string;
    commissionType: 'PERCENTAGE' | 'FIXED';
    commissionValue: number;
    bookingInWorkHours: boolean;
    mondayOpen?: Date | string | null;
    mondayClose?: Date | string | null;
    tuesdayOpen?: Date | string | null;
    tuesdayClose?: Date | string | null;
    wednesdayOpen?: Date | string | null;
    wednesdayClose?: Date | string | null;
    thursdayOpen?: Date | string | null;
    thursdayClose?: Date | string | null;
    fridayOpen?: Date | string | null;
    fridayClose?: Date | string | null;
    saturdayOpen?: Date | string | null;
    saturdayClose?: Date | string | null;
    sundayOpen?: Date | string | null;
    sundayClose?: Date | string | null;
  };
  ticket?: {
    codeFormat?: string;
    designConfig?: any;
    sellingPrice: number;
    eventDate: Date | string;
    eventEndDate?: Date | string | null;
    venue: string;
    venueAddress?: string | null;
    mapUrl?: string | null;
    totalQuota: number;
    maxPerOrder?: number;
    saleStartDate?: Date | string | null;
    saleEndDate?: Date | string | null;
    terms?: string | null;
  };
  media?: any[];
};

export type UpdateProductPayload = Partial<Omit<CreateProductPayload, 'outletId'>>;

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

  create: (productData: CreateProductPayload) =>
    apiClient.post('/products', productData).then(res => res.data.data),

  update: (productId: string, productData: UpdateProductPayload) =>
    apiClient.patch(`/products/${productId}`, productData).then(res => res.data.data),

  delete: (productId: string) =>
    apiClient.delete(`/products/${productId}`).then(res => res.data),

  search: (query: string) =>
    apiClient.get(`/products/search?name=${encodeURIComponent(query)}`).then(res => res.data.data),

  getByBarcode: (code: string, outletId: string): Promise<PosV2Product> =>
    apiClient.get(`/products/barcode/${encodeURIComponent(code)}?outletId=${encodeURIComponent(outletId)}`)
      .then(res => res.data.data),

  confirmImport: (importData: { outletId: string; data: any[]; }) =>
    apiClient.post('/products/import/confirm', importData).then(res => res.data.data),

  updateStock: (productId: string, stockData: { type: 'adjustment' | 'add' | 'subtract'; quantity: number; reason: string; notes?: string; }) =>
    apiClient.patch(`/products/${productId}/stock`, stockData).then(res => res.data.data),
};
