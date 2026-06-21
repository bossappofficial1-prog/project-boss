import { apiClient } from "@/services/api-client";
import type { PaymentDetailData } from "@/types/payment-detail";

export async function getPaymentDetail(orderId: string): Promise<PaymentDetailData> {
  const res = await apiClient.get<{ data: PaymentDetailData }>(`/payments/${orderId}`);
  return res.data;
}
