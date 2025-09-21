import { apiCall, API_BASE_URL, getAuthToken } from './base';

export const dashboardApi = {
  getSummary: (outletId: string) => apiCall<{ totalProducts: number; totalServices: number; totalOrders: number; totalRevenue: number; }>(`/dashboard/summary?outletId=${outletId}`),

  getOrderStats: (outletId: string, period: 'week' | 'month' = 'month') =>
    apiCall<Record<string, { totalOrders: number; totalRevenue: number; }>>(`/dashboard/stats?outletId=${outletId}&period=${period}`),

  exportData: async (outletId: string, type: 'orders' | 'products' | 'reports', format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/reports/export?outletId=${outletId}&type=${type}&format=${format}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  },
};
