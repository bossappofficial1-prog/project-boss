import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';

let socket: Socket | null = null;
const MAX_EVENT_HISTORY = 50;

export const getSocket = (): Socket | null => {
    return socket;
};

export const initializeSocket = (): Socket => {
    if (socket) {
        socket.disconnect();
    }

    const backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:1234';

    socket = io(backendUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
    });

    return socket;
};

export const disconnectSocket = (): void => {
    if (socket) {
        // Leave current business outlet before disconnecting
        if (currentBusinessOutlet) {
            socket.emit('business:leave', currentBusinessOutlet);
            console.log(`📤 Left business outlet room: ${currentBusinessOutlet}`);
            currentBusinessOutlet = null;
        }

        socket.disconnect();
        socket = null;
        console.log('❌ Socket disconnected and cleaned up');
    }
};

// Track current business outlet
let currentBusinessOutlet: string | null = null;

export const joinBusinessOutlet = (outletId: string): void => {
    if (!socket) {
        console.error('❌ joinBusinessOutlet: Socket not initialized');
        return;
    }

    if (!outletId || outletId.trim() === '') {
        console.warn('⚠️ joinBusinessOutlet: Invalid outlet ID provided');
        return;
    }

    // Leave previous business outlet if exists
    if (currentBusinessOutlet && currentBusinessOutlet !== outletId) {
        socket.emit('business:leave', currentBusinessOutlet);
        console.log(`📤 Left previous business outlet room: ${currentBusinessOutlet}`);
    }

    // Join new business outlet
    socket.emit('business:outlet', outletId);
    currentBusinessOutlet = outletId;
    console.log(`📡 Joined business outlet room: ${outletId}`);
};

export const joinOrderRoom = (orderId: string): void => {
    if (!socket) {
        console.error('Socket not initialized');
        return;
    }

    socket.emit('order:update', orderId);
    console.log(`📡 Joined order room: ${orderId}`);
};

// React Hook untuk menggunakan socket
export const useSocket = (outletId?: string) => {
    const [isConnected, setIsConnected] = useState(false);
    const [businessEvents, setBusinessEvents] = useState<any[]>([]);
    const [orderEvents, setOrderEvents] = useState<any[]>([]);

    useEffect(() => {
        const socketInstance = initializeSocket();

        socketInstance.on('connect', () => {
            console.log('🔥 Socket connected:', socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            setIsConnected(false);
        });

        socketInstance.on('businessEvent', (payload) => {
            console.log('🏢 Business event received:', payload);
            setBusinessEvents(prev => [payload, ...prev].slice(0, MAX_EVENT_HISTORY));

            // Note: Browser notifications removed - now handled by SocketProvider with Sonner
        });

        socketInstance.on('orderEvent', (payload) => {
            console.log('📦 Order event received:', payload);
            setOrderEvents(prev => [payload, ...prev].slice(0, MAX_EVENT_HISTORY));
        });

        // Auto-join business outlet room jika outletId disediakan dan valid
        if (outletId && outletId.trim() !== '') {
            console.log(`🔄 useSocket: Joining business outlet room for outletId: ${outletId}`);
            joinBusinessOutlet(outletId);
        } else {
            console.log(`🔄 useSocket: No valid outletId provided (${outletId}), skipping business outlet join`);
        }

        // Cleanup
        return () => {
            socketInstance.off('connect');
            socketInstance.off('disconnect');
            socketInstance.off('businessEvent');
            socketInstance.off('orderEvent');
        };
    }, []); // Remove outletId from dependency

    // Separate effect for outlet changes
    useEffect(() => {
        if (outletId && outletId.trim() !== '') {
            console.log(`🔄 useSocket: Outlet changed, re-joining business outlet room for outletId: ${outletId}`);
            joinBusinessOutlet(outletId);
        } else {
            console.log(`🔄 useSocket: Outlet changed to empty, leaving business outlet room`);
            // Leave current business outlet if exists
            if (currentBusinessOutlet) {
                if (socket) {
                    socket.emit('business:leave', currentBusinessOutlet);
                    console.log(`📤 Left business outlet room due to outlet change: ${currentBusinessOutlet}`);
                    currentBusinessOutlet = null;
                }
            }
        }
    }, [outletId]); // Only depend on outletId changes

    return {
        isConnected,
        businessEvents,
        orderEvents,
        socket: getSocket(),
        joinBusinessOutlet,
        joinOrderRoom
    };
};