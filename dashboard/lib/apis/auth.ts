import { apiCall } from './base';

export const authApi = {
  me: () => apiCall<{ user: { id: string; email: string; name: string; role: string; }; business: { id: string; name: string; description?: string; type?: string; address?: string; phone?: string; bankName?: string; accountNumber?: string; accountHolderName?: string; transactionFeeBearer?: string; }; outlets: Array<{ id: string; name: string; address: string; phone?: string; imageUrl?: string; latitude?: number; longitude?: number; }>; }>(
    '/auth/me'
  ),
};
