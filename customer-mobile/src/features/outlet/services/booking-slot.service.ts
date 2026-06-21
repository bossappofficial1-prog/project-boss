import { apiClient } from "@/services/api-client";
import type { BookingSlot } from "../types/outlet.types";

export async function getSlotByProductId(
  productId: string,
  date: string,
): Promise<BookingSlot[]> {
  const res = await apiClient.get<{ data: BookingSlot[] }>(
    `/products/${productId}/booking-slots?date=${date}`,
  );
  return res.data;
}
