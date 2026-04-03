import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiResponse } from "@/lib/apis/base";

export interface TicketCodeInfo {
  id: string;
  code: string;
  status: "VALID" | "REDEEMED" | "CANCELLED" | "EXPIRED";
  productName: string;
  eventDate: string | null;
  eventEndDate: string | null;
  venue: string | null;
  venueAddress: string | null;
  customerName: string | null;
  customerPhone: string | null;
  orderId: string;
  outletId: string;
  outletName: string;
  redeemedAt: string | null;
  redeemedBy: { id: string; name: string } | null;
  createdAt: string;
}

export interface RedeemResult {
  id: string;
  code: string;
  status: string;
  redeemedAt: string;
  productName: string;
  customerName: string | null;
}

const verifyTicket = async (code: string): Promise<TicketCodeInfo> => {
  const { data } = await apiClient.get<ApiResponse<TicketCodeInfo>>(`/tickets/verify/${code}`);
  return data.data;
};

const redeemTicket = async (code: string, outletId: string): Promise<RedeemResult> => {
  const { data } = await apiClient.post<ApiResponse<RedeemResult>>(`/tickets/redeem/${code}`, { outletId });
  return data.data;
};

export const useVerifyTicket = (code: string) => {
  return useQuery({
    queryKey: ["ticket-verify", code],
    queryFn: () => verifyTicket(code),
    enabled: !!code && code.length >= 5,
    retry: false,
  });
};

export const useRedeemTicket = () => {
  const qc = useQueryClient();
  return useMutation<RedeemResult, unknown, { code: string; outletId: string }>({
    mutationFn: ({ code, outletId }) => redeemTicket(code, outletId),
    onSuccess: (_data, { code }) => {
      qc.invalidateQueries({ queryKey: ["ticket-verify", code] });
    },
  });
};
