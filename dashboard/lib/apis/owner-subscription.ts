import { apiCall, apiCallPaginated, apiClient, type ApiResponse } from "./base";

export type OwnerSubscriptionStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "SUSPENDED"
  | "CANCELLED"
  | "PAST_DUE"
  | "TRIAL"
  | "AWAITING_PAYMENT"
  | "PROOF_SUBMITTED";

export type OwnerPaymentStatus =
  | "PENDING"
  | "PROOF_SUBMITTED"
  | "AWAITING_VERIFICATION"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED"
  | "EXPIRED"
  | "CANCELLED"
  | "REJECTED_MANUAL";

export interface SubscriptionPlanFeatures {
  maxOutlets: number;
  maxProducts: number;
  maxStaff: number;
  canExportReport: boolean;
  supportLevel: "EMAIL" | "WHATSAPP" | "PRIORITY";
}

export interface SubscriptionPlanDetail {
  id: string;
  name: string;
  code: string;
  price: number;
  durationDays: number;
  isActive?: boolean;
  isPopular?: boolean;
  features?: SubscriptionPlanFeatures | null;
}

export interface PlanUsageItem {
  limit: number;
  used: number;
  remaining: number;
  canCreate: boolean;
}

export interface PlanUsageSnapshot {
  outlets: PlanUsageItem;
  products: PlanUsageItem;
  staff: PlanUsageItem;
  subscription: {
    status: OwnerSubscriptionStatus;
    endsAt: string | null;
  };
}

export interface OwnerSubscriptionBusiness {
  id: string;
  name: string;
  subscriptionStatus: OwnerSubscriptionStatus;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
}

export interface OwnerSubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: OwnerPaymentStatus;
  createdAt: string;
  paidAt?: string | null;
  subscriptionId: string;
  plan: SubscriptionPlanDetail;
}

export interface OwnerSubscriptionOverviewResponse {
  business: OwnerSubscriptionBusiness;
  plan: SubscriptionPlanDetail | null;
  usage: PlanUsageSnapshot;
  pendingInvoice: OwnerSubscriptionInvoice | null;
}

export interface OwnerInvoiceListResponse {
  data: OwnerSubscriptionInvoice[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OwnerInvoiceListParams {
  page?: number;
  limit?: number;
}

export interface RenewSubscriptionPayload {
  planCode?: string;
}

export interface RenewSubscriptionResponse {
  message: string;
  invoice: OwnerSubscriptionInvoice;
  subscription: {
    id: string;
    status: OwnerSubscriptionStatus;
    startDate: string;
    endDate: string;
    businessId: string;
    planId: string;
  };
}

export interface UploadPaymentProofPayload {
  invoiceId: string;
  file: File;
}

export interface UploadPaymentProofResponse {
  message: string;
  invoice: OwnerSubscriptionInvoice;
  subscription: {
    id: string;
    status: OwnerSubscriptionStatus;
    startDate: string;
    endDate: string;
    businessId: string;
    planId: string;
  };
}

function buildInvoiceQuery(params?: OwnerInvoiceListParams) {
  if (!params) {
    return "";
  }

  const searchParams = new URLSearchParams();

  if (typeof params.page === "number") {
    searchParams.set("page", params.page.toString());
  }

  if (typeof params.limit === "number") {
    searchParams.set("limit", params.limit.toString());
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const ownerSubscriptionApi = {
  getOverview: () => apiCall<OwnerSubscriptionOverviewResponse>("/subscription/me"),

  listInvoices: async (
    params?: OwnerInvoiceListParams,
  ): Promise<OwnerInvoiceListResponse> => {
    const query = buildInvoiceQuery(params);
    return apiCallPaginated<OwnerSubscriptionInvoice>(`/subscription/invoices${query}`);
  },

  renew: (payload: RenewSubscriptionPayload) =>
    apiCall<RenewSubscriptionResponse>("/subscription/renew", {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
    }),

  uploadPaymentProof: async (
    payload: UploadPaymentProofPayload,
  ): Promise<UploadPaymentProofResponse> => {
    const formData = new FormData();
    formData.append("invoiceId", payload.invoiceId);
    formData.append("proof", payload.file);

    const response = await apiClient.post<ApiResponse<UploadPaymentProofResponse>>("/subscription/upload-proof", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message ?? "Gagal mengunggah bukti pembayaran");
    }

    return response.data.data;
  },
};
