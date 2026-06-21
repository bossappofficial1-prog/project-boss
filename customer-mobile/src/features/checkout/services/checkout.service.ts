import { apiClient } from "@/services/api-client";
import type { CreatePaymentPayload, CreatePaymentResponse } from "@/types/checkout";

export async function createPayment(
  payload: CreatePaymentPayload,
): Promise<CreatePaymentResponse> {
  const res = await apiClient.post<{ data: CreatePaymentResponse }>(
    "/orders/create-payment",
    payload,
  );
  return res.data;
}
