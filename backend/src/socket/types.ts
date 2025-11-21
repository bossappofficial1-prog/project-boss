import { MidtransWebhookPayloadType } from "../types/Others";

export const SOCKET_EVENT = {
    JOIN_OUTLET: "join:outlet",
    JOIN_USER: "join:user",
    JOIN_ORDER: "join:order",
    JOIN_ORDER_UPDATE: "order:update",
    JOIN_BUSINESS: "business:outlet",

    PAYMENT_SUBMIT: "payment:submit",
    PAYMENT_NEW: "payment:new",

    ORDER_EVENT: "orderEvent",
    ORDER_OTHER_EVENT: "otherEvent",
    CUSTOMER_NOTIFICATION: "customer:notification",

    ORDER_UPDATE_STATUS: "order:updateStatus",
    ORDER_STATUS_CHANGED: "order:statusChanged",
    QUEUE_UPDATED: "queue:updated",
    NOTIFICATION_UPDATE: "notification:update"
} as const

export type PaymentSubmitPayload = { orderId: string; outletId: string; amount: number };
export type PaymentNewPayload = { orderId: string; amount: number; message: string };
export type OrderUpdateStatusPayload = { orderId: string; customerId: string; status: string };
export type OrderStatusChangedPayload = { orderId: string; status: string; message: string; type?: string; transactionStatus?: string; paymentMethod?: string };
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
export type JoinOutletPayload = { outletId: string };
export type JoinUserPayload = { userId: string };
export type QueueUpdatedPayload = {
    outletId: string;
    queue: any[];
    updatedOrderId?: string;
    generatedAt: string;
};

export interface ClientToServerEvents {
    [SOCKET_EVENT.JOIN_OUTLET]: (payload: JoinOutletPayload) => void;
    [SOCKET_EVENT.JOIN_USER]: (payload: JoinUserPayload) => void;
    [SOCKET_EVENT.PAYMENT_SUBMIT]: (payload: PaymentSubmitPayload) => void;
    [SOCKET_EVENT.ORDER_UPDATE_STATUS]: (payload: OrderUpdateStatusPayload) => void;
    [SOCKET_EVENT.JOIN_ORDER_UPDATE]: (orderId: string) => void;
    [SOCKET_EVENT.JOIN_BUSINESS]: (outletId: string) => void
}

export interface ServerToClientEvents {
    [SOCKET_EVENT.PAYMENT_NEW]: (payload: PaymentNewPayload) => void;
    [SOCKET_EVENT.ORDER_EVENT]: (payload: MidtransWebhookPayloadType) => void;
    [SOCKET_EVENT.ORDER_OTHER_EVENT]: (payload: MidtransWebhookPayloadType) => void;
    [SOCKET_EVENT.CUSTOMER_NOTIFICATION]: (payload: CustomerNotificationPayload) => void;
    [SOCKET_EVENT.ORDER_STATUS_CHANGED]: (payload: OrderStatusChangedPayload) => void;
    [SOCKET_EVENT.QUEUE_UPDATED]: (payload: QueueUpdatedPayload) => void;
}