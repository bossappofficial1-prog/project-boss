import type { QueueEntry } from '@/lib/apis/order';

export const SOCKET_EVENT = {
    JOIN_OUTLET: "join:outlet",
    JOIN_USER: "join:user",

    PAYMENT_SUBMIT: "payment:submit",
    PAYMENT_NEW: "payment:new",

    ORDER_UPDATE_STATUS: "order:updateStatus",
    ORDER_STATUS_CHANGED: "order:statusChanged",
    QUEUE_UPDATED: "queue:updated"
} as const

export type EventNames = typeof SOCKET_EVENT[keyof typeof SOCKET_EVENT];

export interface UseSocketEventOptions {
    enabled?: boolean;
}

export interface SocketEvents {
    [SOCKET_EVENT.PAYMENT_NEW]: {
        type: string,
        orderId: string,
        amount: number,
        paymentMethod: string,
        customerName: string,
        timestamp: Date
    };
    [SOCKET_EVENT.PAYMENT_SUBMIT]: {
        id: string;
        userId: string;
        content: string;
        timestamp: Date;
    };
    [SOCKET_EVENT.JOIN_OUTLET]: { outletId: string };
    [SOCKET_EVENT.ORDER_UPDATE_STATUS]: {
        orderId: string;
        customerId: string;
        status: string;
    };
    [SOCKET_EVENT.ORDER_STATUS_CHANGED]?: {
        orderId: string;
        status: string;
        message?: string;
    };
    [SOCKET_EVENT.QUEUE_UPDATED]: {
        outletId: string;
        queue: QueueEntry[];
        updatedOrderId?: string;
        generatedAt: string;
    };
    'user-disconnected': {
        userId: string;
    };
}
