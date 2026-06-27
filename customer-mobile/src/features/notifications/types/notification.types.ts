export interface PushSubscriptionPayload {
  expoPushToken: string;
  type: "expo";
  guestPhone?: string;
  guestName?: string;
}

export interface PushUnsubscribePayload {
  endpoint: string;
}

export interface NativeNotificationData {
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}
