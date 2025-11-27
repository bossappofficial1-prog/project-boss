import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Socket } from 'socket.io-client';
import type { CreateOrderResponse } from '@/lib/apis/order';

type BusinessEventPayload = {
    type: 'payment_created' | 'payment_success' | 'payment_failed' | string;
    orderId?: string;
    customerName?: string;
    orderStatus?: string;
};

interface UsePosOnlinePaymentOptions {
    socket: Socket | null;
    isConnected: boolean;
    outletId?: string;
    fetchProducts: (query?: string) => Promise<void> | void;
    searchQuery: string;
}

interface UsePosOnlinePaymentResult {
    onlinePaymentResult: CreateOrderResponse | null;
    isPaymentSettled: boolean;
    isPaymentRejected: boolean;
    handleOrderCreated: (response: CreateOrderResponse, isOnline: boolean) => void;
    resetPaymentState: () => void;
}

export function usePosOnlinePayment({
    socket,
    isConnected,
    outletId,
    fetchProducts,
    searchQuery,
}: UsePosOnlinePaymentOptions): UsePosOnlinePaymentResult {
    const [onlinePaymentResult, setOnlinePaymentResult] = useState<CreateOrderResponse | null>(null);
    const [isPaymentSettled, setIsPaymentSettled] = useState(false);
    const [isPaymentRejected, setIsPaymentRejected] = useState(false);

    const resetPaymentState = useCallback(() => {
        setOnlinePaymentResult(null);
        setIsPaymentSettled(false);
        setIsPaymentRejected(false);
    }, []);

    const handleOrderCreated = useCallback(
        (response: CreateOrderResponse, isOnline: boolean) => {
            if (isOnline) {
                setOnlinePaymentResult(response);
                setIsPaymentSettled(false);
                setIsPaymentRejected(false);
                return;
            }

            resetPaymentState();
        },
        [resetPaymentState],
    );

    useEffect(() => {
        if (!socket || !isConnected || !onlinePaymentResult?.order.id || !outletId) {
            return;
        }

        const handleBusinessEvent = (payload: BusinessEventPayload) => {
            if (!payload || payload.orderId !== onlinePaymentResult.order.id) {
                return;
            }

            if (payload.type === 'payment_success') {
                setIsPaymentSettled(true);
                toast.success('Pembayaran pelanggan berhasil diproses', {
                    description: 'Pesanan otomatis diperbarui dan stok telah disesuaikan.',
                });
                fetchProducts(searchQuery);
                return;
            }

            if (payload.type === 'payment_failed') {
                setIsPaymentRejected(true);
                toast.error('Pembayaran pelanggan gagal diproses', {
                    description: 'Silakan pilih metode pembayaran lain atau coba ulangi.',
                });
            }
        };

        socket.on('businessEvent', handleBusinessEvent);

        return () => {
            socket.off('businessEvent', handleBusinessEvent);
        };
    }, [socket, isConnected, onlinePaymentResult?.order.id, outletId, fetchProducts, searchQuery]);

    useEffect(() => {
        if (!onlinePaymentResult || !isPaymentSettled) {
            return;
        }

        const timer = window.setTimeout(() => {
            resetPaymentState();
        }, 3200);

        return () => {
            window.clearTimeout(timer);
        };
    }, [onlinePaymentResult, isPaymentSettled, resetPaymentState]);

    return {
        onlinePaymentResult,
        isPaymentSettled,
        isPaymentRejected,
        handleOrderCreated,
        resetPaymentState,
    };
}

export default usePosOnlinePayment;
