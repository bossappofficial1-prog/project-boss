import { apiCall } from './base';

export const outletManagementApi = {
  create: (outletData: { name: string; address: string; phone: string; businessId: string; latitude?: number; longitude?: number; image?: string; email?: string; description?: string; openingHours?: string; status?: 'ACTIVE' | 'INACTIVE'; }) =>
    apiCall<{ id: string; name: string; address: string; phone: string; imageUrl?: string; latitude?: number; longitude?: number; }>(
      '/outlets', { method: 'POST', body: JSON.stringify(outletData) }
    ),
  
  update: (outletId: string, outletData: Partial<{ name: string; address: string; phone: string; latitude: number; longitude: number; image: string; }>) =>
    apiCall<any>(`/outlets/${outletId}`, { method: 'PATCH', body: JSON.stringify(outletData) }),
  
  delete: (outletId: string) => apiCall<any>(`/outlets/${outletId}`, { method: 'DELETE' }),
};
