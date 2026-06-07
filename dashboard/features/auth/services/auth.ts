import { apiCall } from '@/lib/apis/base';

export const authApi = {
  me: () => apiCall<{ user: { id: string; email: string; name: string; role: string; }; business: { id: string; name: string; description?: string; type?: string; address?: string; phone?: string; bankName?: string; accountNumber?: string; accountHolderName?: string; transactionFeeBearer?: string; }; outlets: Array<{ id: string; name: string; address: string; phone?: string; imageUrl?: string; latitude?: number; longitude?: number; }> }>(
    '/auth/me'
  ),
  
  cashierLogin: (username: string, password: string) => apiCall<{ staff: { id: string; username: string; name: string; role: string; outletId: string; }; message: string; }>(
    '/auth/cashier/login',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }
  ),

  managerLogin: (name: string, pin: string) => apiCall<{ staff: { id: string; name: string; role: string; outletId: string; email?: string | null; privileges: string[]; }; message: string; }>(
    '/auth/manager/login',
    {
      method: 'POST',
      body: JSON.stringify({ name, pin }),
    }
  ),
  
  cashierMe: () => apiCall<{
    id: string;
    username: string;
    name: string;
    role: string;
    outletId: string;
    email?: string | null;
    privileges?: any[];
    outlet?: {
      id: string;
      name: string;
      address?: string;
      phone?: string;
      type: any;
      business?: {
        id: string;
        name: string;
        subscriptionPlan: string;
      };
    };
  }>(
    '/auth/cashier/me'
  ),
};

