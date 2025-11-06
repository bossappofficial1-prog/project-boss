import { PaginatedResponse } from '@/types';
import { apiClient } from './base';

export const stockApi = {
  getByOutlet: (
    outletId: string,
    params?: { page?: number; limit?: number; search?: string; type?: 'GOODS' | 'SERVICE'; status?: 'ACTIVE' | 'INACTIVE'; }
  ): Promise<PaginatedResponse<{
    id: string;
    name: string;
    type: 'GOODS' | 'SERVICE';
    quantity?: number;
    unit?: string;
    price: number;
    status: 'ACTIVE' | 'INACTIVE';
    image?: string;
  }>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('q', params.search);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.status) searchParams.append('status', params.status);
    const qs = searchParams.toString();
    const endpoint = `/products/outlet/${outletId}${qs ? `?${qs}` : ''}`;
    return apiClient.get(endpoint).then(res => res.data);
  },

  updateStock: (productId: string, stockData: { quantity: number; adjustment?: 'add' | 'remove' | 'set'; adjustmentQuantity?: number; reason?: string; notes?: string; }) =>
    apiClient.patch(`/products/${productId}/stock`, stockData).then(res => res.data.data),
};
