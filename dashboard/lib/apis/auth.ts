import { apiCall } from './base';

export const authApi = {
  me: () => apiCall<{ user: { id: string; email: string; name: string; role: string; }; business: { id: string; name: string; description?: string; type?: string; address?: string; phone?: string; bankName?: string; accountNumber?: string; accountHolderName?: string; transactionFeeBearer?: string; }; outlets: Array<{ id: string; name: string; address: string; phone?: string; imageUrl?: string; latitude?: number; longitude?: number; }>; }>(
    '/auth/me'
  ),
  
  cashierLogin: (username: string, password: string) => apiCall<{ staff: { id: string; username: string; name: string; role: string; outletId: string; }; message: string; }>(
    '/auth/cashier/login',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }
  ),
  
  cashierMe: () => apiCall<{ id: string; username: string; name: string; role: string; outletId: string; outlet?: { id: string; name: string; address?: string; phone?: string; }; }>(
    '/auth/cashier/me'
  ),
};
