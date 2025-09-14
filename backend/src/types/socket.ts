import { DefaultEventsMap } from 'socket.io';

/// Interface untuk event yang diterima dari client
export interface ClientToServerEvents {
    join_business_room: (businessId: string, callback?: (success: boolean) => void) => void;
    leave_business_room: (businessId: string, callback?: (success: boolean) => void) => void;
    ping: (callback?: (response?: string) => void) => void;
    test_event: (data: any) => void; // Added for testing
}
export interface NewOrderData {
    id: string;
    businessId: string;
    customerId?: string;
    guestCustomer?: {
        name: string;
        phone: string;
        email?: string;
    };
    items: Array<{
        id: string;
        productId: string;
        quantity: number;
        price: number;
        product: {
            id: string;
            name: string;
            price: number;
        };
    }>;
    totalAmount: number;
    status: string;
    createdAt: Date;
    outlet: {
        id: string;
        name: string;
    };
}

export interface OrderStatusUpdateData {
    orderId: string;
    businessId: string;
    status: string;
    updatedAt: Date;
}

export interface NotificationData {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    businessId: string;
    createdAt: Date;
}

// Interface untuk event yang diterima dari client
export interface ClientToServerEvents {
    join_business_room: (businessId: string, callback?: (success: boolean) => void) => void;
    leave_business_room: (businessId: string, callback?: (success: boolean) => void) => void;
    ping: (callback?: (response?: string) => void) => void;
    test_event: (data: any) => void;
}

// Interface untuk event yang dikirim ke client
export interface ServerToClientEvents {
    // Authenticated events
    new_order: (data: NewOrderData) => void;
    order_status_update: (data: OrderStatusUpdateData) => void;
    notification: (data: NotificationData) => void;
    business_room_joined: (businessId: string) => void;
    business_room_left: (businessId: string) => void;

    // Public events
    connection_info: (data: { socketId: string; connected: boolean; type: string }) => void;
    announcements_joined: () => void;
    system_announcement: (data: { id: string; title: string; message: string; type: string; createdAt: Date }) => void;

    // Common events
    pong: (message: string) => void;
    error: (message: string) => void;
    test_response: (data: { message: string; originalData: any; serverTimestamp: Date; socketId: string }) => void;
}

// Interface untuk inter-server events (untuk scaling)
export interface InterServerEvents {
    ping: () => void;
}

// Interface untuk socket data (informasi yang disimpan di socket)
export interface SocketData {
    userId?: string;
    businessId?: string;
    userRole?: 'BUSINESS_OWNER' | 'EMPLOYEE' | 'ADMIN';
    authenticated: boolean;
    joinedRooms: string[];
    isPublic?: boolean;
    clientIP?: string;
}

// Type untuk Socket yang sudah di-type
export type TypedSocket = import('socket.io').Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>;

// Type untuk Server yang sudah di-type
export type TypedServer = import('socket.io').Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>;
