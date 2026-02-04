import { apiCall } from "./base";

export type SubscriptionInvoiceStatus =
    | "PENDING"
    | "PROOF_SUBMITTED"
    | "AWAITING_VERIFICATION"
    | "SUCCESS"
    | "FAILED"
    | "REFUNDED"
    | "EXPIRED"
    | "CANCELLED"
    | "REJECTED_MANUAL";

export interface SubscriptionPlanSummary {
    id: string;
    name: string;
    code: string;
    price: number;
    durationDays: number;
}

export interface SubscriptionBusinessSummary {
    id: string;
    name: string;
    subscriptionStatus?: string;
    owner?: {
        id: string;
        name: string;
        email: string;
        phone?: string | null;
    } | null;
}

export interface SubscriptionInvoiceRecord {
    id: string;
    invoiceNumber: string;
    amount: number;
    status: SubscriptionInvoiceStatus;
    proofImage?: string | null;
    proofUploadedAt?: string | null;
    verifiedAt?: string | null;
    rejectionReason?: string | null;
    paidAt?: string | null;
    createdAt: string;
    updatedAt: string;
    business: SubscriptionBusinessSummary;
    subscription: {
        id: string;
        status: string;
        startDate: string;
        endDate: string;
        plan: SubscriptionPlanSummary;
    };
}

export interface SubscriptionInvoiceListResponse {
    data: SubscriptionInvoiceRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface AdminSubscriptionInvoiceListParams {
    status?: SubscriptionInvoiceStatus[];
    search?: string;
    page?: number;
    limit?: number;
}

export interface RejectSubscriptionInvoicePayload {
    invoiceId: string;
    reason: string;
}

function buildQuery(params?: AdminSubscriptionInvoiceListParams) {
    if (!params) return "";

    const searchParams = new URLSearchParams();

    if (params.status && params.status.length > 0) {
        searchParams.append("status", params.status.join(","));
    }

    if (params.search) {
        searchParams.append("search", params.search);
    }

    if (params.page) {
        searchParams.append("page", params.page.toString());
    }

    if (params.limit) {
        searchParams.append("limit", params.limit.toString());
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
}

export const adminSubscriptionInvoiceApi = {
    async list(params?: AdminSubscriptionInvoiceListParams): Promise<SubscriptionInvoiceListResponse> {
        const query = buildQuery(params);
        return apiCall<SubscriptionInvoiceListResponse>(`/admin/subscriptions/invoices${query}`);
    },

    async verify(invoiceId: string): Promise<SubscriptionInvoiceRecord> {
        return apiCall<SubscriptionInvoiceRecord>(`/admin/subscriptions/invoices/${invoiceId}/verify`, {
            method: "POST",
        });
    },

    async reject({ invoiceId, reason }: RejectSubscriptionInvoicePayload): Promise<SubscriptionInvoiceRecord> {
        return apiCall<SubscriptionInvoiceRecord>(`/admin/subscriptions/invoices/${invoiceId}/reject`, {
            method: "POST",
            body: JSON.stringify({ reason }),
        });
    },
};
