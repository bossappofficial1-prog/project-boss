'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppBarV2 } from '@/context/AppBarContextV2';
import { EmptyState } from '@/components/Base';
import OrderCard from './OrderCard';
import { Receipt } from 'lucide-react';

export interface OrderData {
    id: string;
    checkoutData: {
        outlets: Array<{
            outletName: string;
            subtotal: number;
            transactionFee: number;
            applicationFee: number;
        }>;
        subtotal: number;
        totalTransactionFee: number;
        applicationFee: number;
        grandTotal: number;
    };
    selectedPaymentMethod: {
        id: string;
        name: string;
        description: string;
        type: string;
    };
    customerInfo: {
        name: string;
        phone: string;
    };
    paymentDate: string;
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    orderNumber?: string;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<OrderData[]>([]);
    const { setAppBar } = useAppBarV2();
    const router = useRouter();

    useEffect(() => {
        setAppBar({
            title: "Pesanan Saya",
            subtitle: "Riwayat dan status pesanan",
            showSearch: false,
            centerTitle: true,
            rightContent: null
        });

        // Load orders from localStorage
        loadOrders();
    }, [setAppBar]);

    const loadOrders = () => {
        try {
            const savedOrders = localStorage.getItem('userOrders');
            if (savedOrders) {
                const parsedOrders = JSON.parse(savedOrders);
                setOrders(Array.isArray(parsedOrders) ? parsedOrders : []);
            } else {
                // If no orders exist, check for lastPayment (single order)
                const lastPayment = localStorage.getItem('lastPayment');
                if (lastPayment) {
                    const paymentData = JSON.parse(lastPayment);
                    const order: OrderData = {
                        id: Date.now().toString(),
                        ...paymentData,
                        status: 'pending',
                        orderNumber: `ORD-${Date.now().toString().slice(-6)}`
                    };
                    setOrders([order]);
                    // Save this as the first order
                    localStorage.setItem('userOrders', JSON.stringify([order]));
                }
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            setOrders([]);
        }
    };

    const handleBrowseOutlets = () => {
        router.push('/nearby');
    };

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <EmptyState
                    title="Belum Ada Pesanan"
                    description="Anda belum memiliki pesanan. Mulai pesan dari outlet terdekat!"
                    icon={<Receipt className="w-6 h-6 text-muted-foreground" />}
                    action={{
                        label: "Jelajahi Outlet",
                        onClick: handleBrowseOutlets
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {orders.length} {orders.length === 1 ? 'pesanan' : 'pesanan'} ditemukan
                </p>
            </div>

            <div className="space-y-3">
                {orders.map((order) => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        onStatusUpdate={(orderId: string, newStatus: OrderData['status']) => {
                            setOrders(prev =>
                                prev.map(order =>
                                    order.id === orderId
                                        ? { ...order, status: newStatus }
                                        : order
                                )
                            );
                            // Update localStorage
                            const updatedOrders = orders.map(order =>
                                order.id === orderId
                                    ? { ...order, status: newStatus }
                                    : order
                            );
                            localStorage.setItem('userOrders', JSON.stringify(updatedOrders));
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
