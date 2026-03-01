'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { initializeSocket, disconnectSocket, joinBusinessOutlet, getSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    businessEvents: any[];
    orderEvents: any[];
    joinBusinessOutlet: (outletId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
    children: React.ReactNode;
    outletId?: string | null; // Optional outlet ID - can be passed directly for cashier
}

const MAX_EVENT_HISTORY = 50;

export function SocketProvider({ children, outletId: providedOutletId }: SocketProviderProps) {
    const router = useRouter();

    const [isConnected, setIsConnected] = useState(false);
    const [businessEvents, setBusinessEvents] = useState<any[]>([]);
    const [orderEvents, setOrderEvents] = useState<any[]>([]);

    // Determine outlet ID - either from prop (cashier) or from context (owner)
    const outletId = providedOutletId;

    useEffect(() => {
        // Initialize socket regardless of outlet availability
        // Socket can work without outlet data
        const socket = initializeSocket();

        socket.on('connect', () => {
            console.log('🔥 Socket connected:', socket.id);
            setIsConnected(true);
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            setIsConnected(false);
        });

        socket.on('businessEvent', (payload) => {
            console.log('🏢 Business event received:', payload);
            setBusinessEvents(prev => [payload, ...prev].slice(0, MAX_EVENT_HISTORY));

            // Sonner notification for payment events
            if (payload.type === 'payment_created' || payload.type === 'payment_success' || payload.type === 'payment_failed') {
                let title = 'Pembayaran';
                let description = '';
                let variant: 'success' | 'error' | 'default' = 'default';

                if (payload.type === 'payment_created') {
                    title = 'Pembayaran Dibuat!';
                    description = `Pembayaran baru dari ${payload.customerName}${payload.amount ? ` - Rp ${payload.amount.toLocaleString('id-ID')}` : ''}`;
                    variant = 'default';
                } else if (payload.type === 'payment_success') {
                    title = 'Pembayaran Berhasil!';
                    description = `Pembayaran berhasil dari ${payload.customerName} - Status: ${payload.orderStatus}`;
                    variant = 'success';
                } else if (payload.type === 'payment_failed') {
                    title = 'Pembayaran Gagal!';
                    description = `Pembayaran gagal dari ${payload.customerName} - Status: ${payload.orderStatus}`;
                    variant = 'error';
                }

                const toastId = `payment-${payload.type}-${payload.orderId ?? payload.customerName ?? 'unknown'}`;

                // Show toast with action button
                if (variant === 'success') {
                    toast.success(title, {
                        id: toastId,
                        description,
                        duration: 10000,
                        action: {
                            label: "Lihat Pesanan",
                            onClick: () => {
                                if (payload.orderId) {
                                    router.push(`/owner/orders/${payload.orderId}`);
                                } else {
                                    router.push('/owner/orders');
                                }
                            }
                        }
                    });
                } else if (variant === 'error') {
                    toast.error(title, {
                        id: toastId,
                        description,
                        duration: 10000,
                        action: {
                            label: "Lihat Pesanan",
                            onClick: () => {
                                if (payload.orderId) {
                                    router.push(`/owner/orders/${payload.orderId}`);
                                } else {
                                    router.push('/owner/orders');
                                }
                            }
                        }
                    });
                } else {
                    toast(title, {
                        id: toastId,
                        description,
                        duration: 10000,
                        action: {
                            label: "Lihat Pesanan",
                            onClick: () => {
                                if (payload.orderId) {
                                    router.push(`/owner/orders/${payload.orderId}`);
                                } else {
                                    router.push('/owner/orders');
                                }
                            }
                        }
                    });
                }
            }
        });

        socket.on('orderEvent', (payload) => {
            console.log('📦 Order event received:', payload);
            setOrderEvents(prev => [payload, ...prev].slice(0, MAX_EVENT_HISTORY));
        });

        // Cleanup on unmount
        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('businessEvent');
            socket.off('orderEvent');
            disconnectSocket();
        };
    }, [router]);

    // Join business outlet when outletId changes
    useEffect(() => {
        if (outletId && isConnected) {
            console.log('🏢 Joining business outlet:', outletId);
            joinBusinessOutlet(outletId);
        }
    }, [outletId, isConnected]);

    const contextValue: SocketContextType = {
        socket: getSocket(),
        isConnected,
        businessEvents,
        orderEvents,
        joinBusinessOutlet
    };

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocketContext() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocketContext must be used within SocketProvider');
    }
    return context;
}