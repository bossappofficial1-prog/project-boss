import { useQuery } from "@tanstack/react-query";
import { apiCall } from "@/lib/apis/base";

export interface TicketCodeItem {
    id: string;
    code: string;
    status: "VALID" | "REDEEMED" | "CANCELLED" | "EXPIRED";
    createdAt: string;
    redeemedAt: string | null;
    orderItem: {
        order: {
            id: string;
            orderStatus: string;
            guestCustomer: { name: string; phone: string } | null;
        };
    };
    redeemedBy: { id: string; name: string } | null;
}

interface TicketCodesResponse {
    codes: TicketCodeItem[];
    total: number;
    page: number;
    limit: number;
}

export function useTicketCodesByProduct(productId: string | null, page = 1, limit = 50) {
    return useQuery({
        queryKey: ["ticket-codes", productId, page, limit],
        queryFn: () =>
            apiCall<TicketCodesResponse>(
                `/tickets/product/${productId}/codes?page=${page}&limit=${limit}`,
            ),
        enabled: !!productId,
    });
}
