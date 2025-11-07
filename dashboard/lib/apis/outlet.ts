import { apiCall, apiClient } from './base';
import type { OutletAnalyticsResponse, OutletRevenueTrendResponse, TimeframeFilter } from '@/types/outlet';

export interface BusinessHours {
  id: string;
  dayOfWeek: number;
  openTime: string; // Time string from backend (converted from DateTime)
  closeTime: string; // Time string from backend (converted from DateTime)
  isOpen: boolean;
  outletId: string;
  // Helper properties for display
  day: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
}

export const outletApi = {
  getByBusiness: (businessId: string, params?: { take?: number; limit?: number; search?: string; }) => {
    const searchParams = new URLSearchParams();
    if (params?.take) searchParams.append('take', params.take.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    const qs = searchParams.toString();
    const endpoint = `/outlets/business/${businessId}${qs ? `?${qs}` : ''}`;
    return apiCall<Array<{ id: string; name: string; address: string; phone?: string; imageUrl?: string; latitude?: number; longitude?: number; }>>(endpoint);
  },

  getBusinessHours: async (outletId: string): Promise<BusinessHours[]> => {
    const response = await apiCall<Array<{
      id: string;
      dayOfWeek: number;
      openTime: string;
      closeTime: string;
      isOpen: boolean;
      outletId: string;
    }>>(`/operating-hours/outlet/${outletId}`);

    // Convert to our format with helper properties
    const dayNames: BusinessHours['day'][] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    return response.map(hour => ({
      ...hour,
      day: dayNames[hour.dayOfWeek],
      // Convert DateTime strings to HH:MM format
      openTime: hour.openTime ? new Date(hour.openTime).toTimeString().slice(0, 5) : '00:00',
      closeTime: hour.closeTime ? new Date(hour.closeTime).toTimeString().slice(0, 5) : '00:00',
    }));
  },

  getDashboard: (outletId: string) => apiCall<{
    totalSales: number; totalOrders: number; totalExpenses: number; profit: number;
    topProducts: Array<{ productId: string; name: string; quantity: number; revenue: number; }>;
  }>(`/dashboard/outlet/${outletId}`),

  getAnalytics: (outletId: string) => apiCall<OutletAnalyticsResponse>(`/outlets/${outletId}/analytics`),

  getRevenueTrend: (outletId: string, params?: { timeframe?: TimeframeFilter; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.timeframe) searchParams.append('timeframe', params.timeframe);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    const qs = searchParams.toString();
    return apiCall<OutletRevenueTrendResponse>(`/outlets/${outletId}/revenue-trend${qs ? `?${qs}` : ''}`);
  },

  getDailyReport: (
    outletId: string,
    params?: { startDate?: string; endDate?: string; productType?: 'GOODS' | 'SERVICE' | 'BOTH' }
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    if (params?.productType) searchParams.append('productType', params.productType);
    const qs = searchParams.toString();
    const endpoint = `/reports/daily/${outletId}${qs ? `?${qs}` : ''}`;
    return apiCall<{
      daily: Array<{
        tanggal: string;
        jumlahTransaksi: number;
        totalPendapatan: number;
        totalPengeluaran: number;
        labaBersih: number;
      }>;
      summary: {
        totalTransaksi: number;
        totalPendapatan: number;
        totalPengeluaran: number;
        totalLabaBersih: number;
      };
    }>(endpoint);
  },

  // QRIS Management
  getQRIS: (outletId: string) => apiCall<{
    outletId: string;
    outletName: string;
    qrisImageUrl: string | null;
  }>(`/outlets/${outletId}/qris`),

  uploadQRIS: async (outletId: string, fileUrl: string) => {
    const response = await apiClient.post(`/outlets/${outletId}/qris`, { fileUrl });
    return response.data.data;
  },

  deleteQRIS: async (outletId: string) => {
    const response = await apiClient.delete(`/outlets/${outletId}/qris`);
    return response.data;
  },
};
