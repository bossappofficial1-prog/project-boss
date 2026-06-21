import { apiClient } from "@/services/api-client";

export async function uploadManualPaymentProof(
  orderId: string,
  file: { uri: string; type: string; name: string },
): Promise<void> {
  const formData = new FormData();
  formData.append("proof", {
    uri: file.uri,
    type: file.type,
    name: file.name,
  } as any);

  await apiClient.post(`/payments/${orderId}/manual/proof`, formData);
}
