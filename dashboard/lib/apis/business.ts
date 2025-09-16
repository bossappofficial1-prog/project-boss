import { apiCall } from './base';

export const businessApi = {
  getDashboard: (businessId: string) => apiCall<{
    totalRevenue: number;
    totalOrders: number;
    totalExpenses: number;
    totalProducts: number;
    totalServices: number;
    dailyRevenue: number;
    topProducts: Array<{ productId: string; name: string; quantity: number; revenue: number; }>;
  }>(`/dashboard/business/${businessId}`),

  getMyBusiness: () => apiCall<any>(`/business/my/business`),

  updateBusiness: (businessId: string, data: Partial<{ name: string; description?: string; type?: string; address?: string; phone?: string }>) =>
    apiCall<any>(`/business/${businessId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  createBusiness: (data: { name: string; description?: string; bankName?: string; bankAccount?: string; accountHolder?: string; defaultTransactionFeeBearer?: 'CUSTOMER' | 'OWNER' }) =>
    apiCall<any>(`/business`, { method: 'POST', body: JSON.stringify(data) }),

  updateBankAccount: (businessId: string, bankData: { bankName: string; bankAccount: string; accountHolder: string; }) =>
    apiCall<any>(`/business/${businessId}/bank-account`, { method: 'PUT', body: JSON.stringify(bankData) }),

  createOutlet: (outletData: { name: string; address: string; phone?: string; email?: string; description?: string; openingHours?: string; status: 'ACTIVE' | 'INACTIVE'; }) =>
    apiCall<any>('/outlets', { method: 'POST', body: JSON.stringify(outletData) }),
};
