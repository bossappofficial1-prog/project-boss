import { apiCall } from './base';

export const outletTransferApi = {
  createRequest: (outletId: string, data: { receiverEmail: string; note?: string }) =>
    apiCall<any>(`/outlets/${outletId}/transfer`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getIncoming: () => apiCall<any[]>('/outlets/transfers/incoming'),

  getOutgoing: () => apiCall<any[]>('/outlets/transfers/outgoing'),

  accept: (id: string) => apiCall<any>(`/outlets/transfers/${id}/accept`, { method: 'POST' }),

  reject: (id: string) => apiCall<any>(`/outlets/transfers/${id}/reject`, { method: 'POST' }),

  cancel: (id: string) => apiCall<any>(`/outlets/transfers/${id}/cancel`, { method: 'DELETE' }),
};
