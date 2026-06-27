import { apiClient } from "@/src/services/api-client";

import type { PushSubscriptionPayload } from "../types/notification.types";

export async function subscribePush(
  payload: PushSubscriptionPayload
): Promise<void> {
  await apiClient.post("/push-notification/subscribe", payload);
}

export async function unsubscribePush(
  endpoint: string
): Promise<void> {
  await apiClient.post("/push-notification/unsubscribe", { endpoint });
}
