import { apiCall } from './base';

export type ManualPaymentStatus =
  | 'PENDING'
  | 'PROOF_SUBMITTED'
  | 'AWAITING_VERIFICATION'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REJECTED_MANUAL';

export type ManualPaymentMethod = 'QRIS_OFFLINE' | 'OWNER_TRANSFER';

export interface ManualPaymentCustomer {
  id?: string;
  name: string;
  phone?: string | null;
}

export interface ManualPaymentOutlet {
  id: string;
  name: string;
  business?: {
    id: string;
    name: string;
  } | null;
}

export interface ManualPaymentOrder {
  id: string;
  totalAmount: number;
  paymentStatus: ManualPaymentStatus;
  orderStatus: string;
  createdAt?: string;
  outletId: string;
  guestCustomer: ManualPaymentCustomer;
  outlet: ManualPaymentOutlet;
}

export interface ManualPaymentTransaction {
  id: string;
  amount: number;
  paymentMethod: string | null;
  status: ManualPaymentStatus;
  isManual: boolean;
  manualMethod: ManualPaymentMethod;
  paymentProofUrl?: string | null;
  proofUploadedAt?: string | null;
  verifiedAt?: string | null;
  verifiedById?: string | null;
  rejectionNote?: string | null;
  expiresAt?: string | null;
  orderId: string;
  order: ManualPaymentOrder;
  createdAt: string;
}

export interface ManualPaymentListResponse {
  data: ManualPaymentTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ManualPaymentListParams {
  status?: ManualPaymentStatus[];
  outletId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

function buildQuery(params?: ManualPaymentListParams) {
  if (!params) return '';
  const searchParams = new URLSearchParams();

  if (params.status && params.status.length > 0) {
    searchParams.append('status', params.status.join(','));
  }

  if (params.outletId) {
    searchParams.append('outletId', params.outletId);
  }

  if (params.search) {
    searchParams.append('search', params.search);
  }

  if (params.page) {
    searchParams.append('page', params.page.toString());
  }

  if (params.limit) {
    searchParams.append('limit', params.limit.toString());
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export const manualPaymentApi = {
  async list(params?: ManualPaymentListParams): Promise<ManualPaymentListResponse> {
    const query = buildQuery(params);
    return apiCall<ManualPaymentListResponse>(`/payments/manual${query}`);
  },

  async verify(orderId: string): Promise<ManualPaymentTransaction> {
    return apiCall<ManualPaymentTransaction>(`/payments/${orderId}/manual/verify`, {
      method: 'POST'
    });
  },

  async reject(orderId: string, reason: string): Promise<ManualPaymentTransaction> {
    return apiCall<ManualPaymentTransaction>(`/payments/${orderId}/manual/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }
};

export default manualPaymentApi;