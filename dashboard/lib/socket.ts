import { io, Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';

let socket: Socket | null = null;

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
        socket.disconnect();
        socket = null;
    }
};

export const joinBusinessOutlet = (outletId: string): void => {
    if (!socket) {
        console.error('Socket not initialized');
        return;
    }

    socket.emit('business:outlet', outletId);
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
            setBusinessEvents(prev => [payload, ...prev]);

            // Browser notification for payment events
            if ((payload.type === 'payment_created' || payload.type === 'payment_success' || payload.type === 'payment_failed') && 'Notification' in window) {
                let title = 'Pembayaran';
                let body = '';

                if (payload.type === 'payment_created') {
                    title = 'Pembayaran Dibuat!';
                    body = `Pembayaran baru dari ${payload.customerName} - ${payload.amount ? `Rp ${payload.amount.toLocaleString('id-ID')}` : ''}`;
                } else if (payload.type === 'payment_success') {
                    title = 'Pembayaran Berhasil!';
                    body = `Pembayaran berhasil dari ${payload.customerName} - Status: ${payload.orderStatus}`;
                } else if (payload.type === 'payment_failed') {
                    title = 'Pembayaran Gagal!';
                    body = `Pembayaran gagal dari ${payload.customerName} - Status: ${payload.orderStatus}`;
                }

                if (Notification.permission === 'granted') {
                    new Notification(title, {
                        body: body,
                        icon: '/favicon.ico',
                        tag: `payment-${payload.type}`
                    });
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            new Notification(title, {
                                body: body,
                                icon: '/favicon.ico',
                                tag: `payment-${payload.type}`
                            });
                        }
                    });
                }
            }
        });

        socketInstance.on('orderEvent', (payload) => {
            console.log('📦 Order event received:', payload);
            setOrderEvents(prev => [payload, ...prev]);
        });

        // Auto-join business outlet room jika outletId disediakan
        if (outletId) {
            joinBusinessOutlet(outletId);
        }

        // Cleanup
        return () => {
            socketInstance.off('connect');
            socketInstance.off('disconnect');
            socketInstance.off('businessEvent');
            socketInstance.off('orderEvent');
        };
    }, [outletId]);

    return {
        isConnected,
        businessEvents,
        orderEvents,
        socket: getSocket(),
        joinBusinessOutlet,
        joinOrderRoom
    };
};