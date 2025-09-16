import { apiCall } from './base';

export const expenseApi = {
  getByOutlet: (outletId: string, params?: { startDate?: string; endDate?: string; }) => {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    const qs = searchParams.toString();
    const endpoint = `/expenses/outlet/${outletId}${qs ? `?${qs}` : ''}`;
    return apiCall<Array<{ id: string; description: string; amount: number; category: string; date: string; createdAt: string; }>>(endpoint);
  },

  create: (expenseData: { description: string; amount: number; category: string; outletId: string; date: string; }) => {
    const payload = {
      // Backend Expense model doesn't have 'category'; omit it from payload
      description: expenseData.description,
      amount: expenseData.amount,
      outletId: expenseData.outletId,
      date: expenseData.date.includes('T') ? expenseData.date : new Date(`${expenseData.date}T00:00:00.000Z`).toISOString(),
    };
    return apiCall<any>('/expenses', { method: 'POST', body: JSON.stringify(payload) });
  },

  update: (id: string, expenseData: Partial<{ description: string; amount: number; category: string; date: string; }>) => {
    const { description, amount, date } = expenseData;
    const payload: any = {};
    if (typeof description === 'string') payload.description = description;
    if (typeof amount === 'number') payload.amount = amount;
    if (typeof date === 'string') {
      payload.date = date.includes('T') ? date : new Date(`${date}T00:00:00.000Z`).toISOString();
    }
    return apiCall<any>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },

  delete: (id: string) => apiCall<any>(`/expenses/${id}`, { method: 'DELETE' }),
};
