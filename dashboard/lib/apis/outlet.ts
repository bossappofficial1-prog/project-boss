import { apiCall } from './base';

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

  getDashboard: (outletId: string) => apiCall<{
    totalSales: number; totalOrders: number; totalExpenses: number; profit: number;
    topProducts: Array<{ productId: string; name: string; quantity: number; revenue: number; }>;
  }>(`/dashboard/outlet/${outletId}`),

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
};
