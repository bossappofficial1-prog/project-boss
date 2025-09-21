import { apiCall, apiClient } from './base';

export const dashboardApi = {
  getSummary: (outletId: string) => apiCall<{ totalProducts: number; totalServices: number; totalOrders: number; totalRevenue: number; }>(`/dashboard/summary?outletId=${outletId}`),

  getOrderStats: (outletId: string, period: 'week' | 'month' = 'month') =>
    apiCall<Record<string, { totalOrders: number; totalRevenue: number; }>>(`/dashboard/stats?outletId=${outletId}&period=${period}`),

  exportData: async (outletId: string, type: 'orders' | 'products' | 'reports', format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> => {
    const response = await apiClient.get(`/reports/export?outletId=${outletId}&type=${type}&format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
