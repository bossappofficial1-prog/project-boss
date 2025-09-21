import { apiCall } from './base';

export const withdrawalApi = {
  getCalculation: (businessId: string) => apiCall<{ availableAmount: number; pendingAmount: number; totalRevenue: number; totalExpenses: number; minWithdrawal: number; }>(`/withdrawals/business/${businessId}/calculation`),

  request: (businessId: string, withdrawalData: { amount: number; bankAccount: { bankName: string; accountNumber: string; accountHolderName: string; }; notes?: string; }) =>
    apiCall<any>(`/withdrawals/business/${businessId}/request`, { method: 'POST', body: JSON.stringify(withdrawalData) }),

  getHistory: (businessId: string, params?: { limit?: number; offset?: number; }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    const qs = searchParams.toString();
    const endpoint = `/withdrawals/business/${businessId}/history${qs ? `?${qs}` : ''}`;
    return apiCall<Array<{ id: string; amount: number; status: string; bankAccount: { bankName: string; accountNumber: string; accountHolderName: string; }; notes?: string; requestedAt: string; processedAt?: string; }>>(endpoint);
  },
};
