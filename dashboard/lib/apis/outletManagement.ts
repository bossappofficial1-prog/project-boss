import { Outlet } from '@/types';
import { apiCall } from './base';
import { OutletResponseStandard } from '@/types/outlet';

export const outletManagementApi = {
  create: (outletData: { name: string; address: string; phone: string; businessId: string; latitude?: number; longitude?: number; image?: string; description?: string; openingHours?: string; isOpen?: boolean; }) =>
    apiCall<OutletResponseStandard>(
      '/outlets', { method: 'POST', body: JSON.stringify(outletData) }
    ),

  getById: (outletId: string) => apiCall<any>(`/outlets/${outletId}`),

  update: (outletId: string, outletData: Partial<Outlet>) =>
    apiCall<any>(`/outlets/${outletId}`, { method: 'PATCH', body: JSON.stringify(outletData) }),

  delete: (outletId: string) => apiCall<any>(`/outlets/${outletId}`, { method: 'DELETE' }),

  getOperatingHours: (outletId: string) => apiCall<any>(`/operating-hours/outlet/${outletId}`),
};
