import { apiClient } from "@/services/api-client";
import type { OrderDetail } from "@/types/order";

export async function getOrdersByPhone(phone: string): Promise<OrderDetail[]> {
  const res = await apiClient.get<{ data: OrderDetail[] }>(
    `/orders/details/${phone}`,
  );
  return res.data;
}

export async function cancelOrder(
  orderId: string,
  phone: string,
): Promise<void> {
  await apiClient.post(`/orders/${orderId}/customer/cancel`, { phone });
}

export async function confirmOrder(
  orderId: string,
  phone: string,
): Promise<void> {
  await apiClient.post(`/orders/${orderId}/customer/confirm`, { phone });
}
