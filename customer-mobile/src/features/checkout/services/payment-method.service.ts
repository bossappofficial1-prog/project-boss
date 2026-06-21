import { apiClient } from "@/services/api-client";
import type { PaymentMethod } from "@/types/payment";

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const res = await apiClient.get<{ data: PaymentMethod[] }>("/payment-methods");
  return res.data;
}
