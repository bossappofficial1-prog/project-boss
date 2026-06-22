export const SOCKET_EVENTS = {
  JOIN_USER: "join:user",
  JOIN_ORDER_UPDATE: "order:update",
  JOIN_OUTLET: "join:outlet",

  ORDER_STATUS_CHANGED: "order:statusChanged",
  CUSTOMER_NOTIFICATION: "customer:notification",
  NOTIFICATION_UPDATE: "notification:update",
} as const;

export type OrderStatusChangedPayload = {
  orderId: string;
  status: string;
  message: string;
  type?: string;
  transactionStatus?: string;
  paymentMethod?: string;
};

export type CustomerNotificationPayload = {
  orderId: string;
  amount: number;
  status: string;
  isManual: boolean;
  transactionStatus?: string;
  paymentMethod?: string;
  type?: string;
  message?: string;
};

export type NotificationUpdatePayload = {
  message: string;
  timestamp: Date;
};

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || "http://localhost:1234";

let socket: any = null;

export async function getSocket() {
  if (socket) return socket;

  try {
    const { io } = await import("socket.io-client");
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    return socket;
  } catch (err) {
    console.warn("[Socket] Failed to initialize:", err);
    return null;
  }
}
