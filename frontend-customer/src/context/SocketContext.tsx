'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type SocketEventHandler = (payload: any) => void;

type SocketContextValue = {
    socket: Socket | null;
    isConnected: boolean;
    emitEvent: (event: string, payload?: unknown) => void;
    onEvent: (event: string, handler: SocketEventHandler) => () => void;
    joinOrderRoom: (orderId: string) => void;
    joinCustomerRoom: (userIdentifier: string) => void;
};

export const SocketContext = createContext<SocketContextValue | undefined>(undefined);

const SOCKET_EVENTS = {
    JOIN_ORDER_UPDATE: 'order:update',
    JOIN_USER: 'join:user',
    ORDER_EVENT: 'orderEvent',
    ORDER_OTHER_EVENT: 'otherEvent',
    CUSTOMER_NOTIFICATION: 'customer:notification',
} as const;

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:1234';

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socket = io(SOCKET_URL, {
            transports: ['websocket'],
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        const handleConnect = () => {
            setIsConnected(true);
        };

        const handleDisconnect = () => {
            setIsConnected(false);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.connect();

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    const emitEvent = useCallback((event: string, payload?: unknown) => {
        const socket = socketRef.current;
        if (!socket) {
            console.warn('Socket not ready. Skipping emit for event:', event);
            return;
        }
        socket.emit(event, payload);
    }, []);

    const onEvent = useCallback((event: string, handler: SocketEventHandler) => {
        const socket = socketRef.current;
        if (!socket) {
            console.warn('Socket not ready. Skipping subscription for event:', event);
            return () => undefined;
        }

        socket.on(event, handler);
        return () => {
            socket.off(event, handler);
        };
    }, []);

    const joinOrderRoom = useCallback((orderId: string) => {
        if (!orderId) return;
        emitEvent(SOCKET_EVENTS.JOIN_ORDER_UPDATE, orderId);
    }, [emitEvent]);

    const joinCustomerRoom = useCallback((userIdentifier: string) => {
        if (!userIdentifier) return;
        const socket = socketRef.current;
        if (!socket) {
            console.warn('Socket not ready. Skipping join:user for', userIdentifier);
            return;
        }
        socket.emit(SOCKET_EVENTS.JOIN_USER, { userId: userIdentifier });
    }, []);

    const value = useMemo<SocketContextValue>(() => ({
        socket: socketRef.current,
        isConnected,
        emitEvent,
        onEvent,
        joinOrderRoom,
        joinCustomerRoom,
    }), [emitEvent, isConnected, joinCustomerRoom, joinOrderRoom]);

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export function useCustomerSocket() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useCustomerSocket must be used within a SocketProvider');
    }
    return context;
}

export const CustomerSocketEvents = SOCKET_EVENTS;
