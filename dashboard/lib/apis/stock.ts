import { apiCall } from './base';

export const stockApi = {
  getByOutlet: (outletId: string, params?: { search?: string; type?: 'GOODS' | 'SERVICE'; status?: 'ACTIVE' | 'INACTIVE'; }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('q', params.search);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.status) searchParams.append('status', params.status);
    const qs = searchParams.toString();
    const endpoint = `/products/outlet/${outletId}${qs ? `?${qs}` : ''}`;
    return apiCall<Array<{ id: string; name: string; type: 'GOODS' | 'SERVICE'; quantity?: number; unit?: string; price: number; status: 'ACTIVE' | 'INACTIVE'; image?: string; }>>(endpoint);
  },

  updateStock: (productId: string, stockData: { quantity: number; adjustment?: 'add' | 'remove' | 'set'; adjustmentQuantity?: number; reason?: string; notes?: string; }) =>
    apiCall<any>(`/products/${productId}/stock`, { method: 'PATCH', body: JSON.stringify(stockData) }),
};
