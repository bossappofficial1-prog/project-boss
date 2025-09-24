'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { initializeSocket, disconnectSocket, joinBusinessOutlet, getSocket } from '@/lib/socket';
import { useOutletContext } from './OutletProvider';
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
}

export function SocketProvider({ children }: SocketProviderProps) {
    const router = useRouter();

    // Get outlet context
    const { selectedOutlet } = useOutletContext();

    const [isConnected, setIsConnected] = useState(false);
    const [businessEvents, setBusinessEvents] = useState<any[]>([]);
    const [orderEvents, setOrderEvents] = useState<any[]>([]);

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
            setBusinessEvents(prev => [payload, ...prev]);

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

                // Show toast with action button
                if (variant === 'success') {
                    toast.success(title, {
                        description,
                        duration: Infinity, // No auto-close
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
                        description,
                        duration: Infinity, // No auto-close
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
                        description,
                        duration: Infinity, // No auto-close
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
            setOrderEvents(prev => [payload, ...prev]);
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

    // Join business outlet when selectedOutlet changes
    useEffect(() => {
        if (selectedOutlet && isConnected) {
            joinBusinessOutlet(selectedOutlet.id);

            // Show notification that outlet changed
            toast.success('Outlet berubah', {
                description: `Sekarang terhubung ke ${selectedOutlet.name}`,
                duration: 3000, // Short duration for this type of notification
            });
        }
    }, [selectedOutlet, isConnected]);

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