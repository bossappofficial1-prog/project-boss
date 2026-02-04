import { apiClient } from "@/lib/apis/base";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface SubscriptionStatus {
    business: {
        id: string;
        name: string;
        subscriptionPlan: string;
        subscriptionStatus: string;
        subscriptionEndDate: string | null;
    };
    subscription: {
        id: string;
        status: string;
        startDate: string;
        endDate: string;
        plan: {
            id: string;
            name: string;
            code: string;
            price: number;
            durationDays: number;
            features: {
                maxOutlets: number;
                maxProducts: number;
                maxStaff: number;
                canExportReport: boolean;
                supportLevel: string;
            };
        };
    } | null;
    invoices: Array<{
        id: string;
        invoiceNumber: string;
        amount: number;
        status: string;
        createdAt: string;
        paidAt: string | null;
    }>;
}

export interface UsageStatistics {
    usage: {
        outlets: number;
        products: number;
        staff: number;
    };
    limits: {
        outlets: number;
        products: number;
        staff: number;
    };
    plan: string;
    status: string;
    endDate: string | null;
}

/**
 * Hook to get current subscription status
 */
export const useSubscriptionStatus = () => {
    return useQuery<SubscriptionStatus>({
        queryKey: ["subscription-status"],
        queryFn: async () => {
            const response = await apiClient.get("/auth/subscription/status");
            return response.data.data;
        },
    });
};

/**
 * Hook to renew subscription
 */
export const useRenewSubscription = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (planCode?: string) => {
            const response = await apiClient.post("/auth/subscription/renew", {
                planCode,
            });
            return response.data.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["subscription-status"] });
            toast.success("Berhasil membuat invoice renewal. Silakan lakukan pembayaran.");
            
            // Redirect to payment page if invoice created
            if (data.invoice && data.invoice.id) {
                window.location.href = `/subscription/payment?invoiceId=${data.invoice.id}`;
            }
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || "Gagal melakukan renewal";
            toast.error(errorMessage);
        },
    });
};

/**
 * Hook to get usage statistics
 */
export const useUsageStatistics = () => {
    return useQuery<UsageStatistics>({
        queryKey: ["usage-statistics"],
        queryFn: async () => {
            const response = await apiClient.get("/business/usage-statistics");
            return response.data.data;
        },
    });
};
