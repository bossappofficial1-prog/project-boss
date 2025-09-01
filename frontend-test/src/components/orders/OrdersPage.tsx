'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAppBarV2 } from '@/context/AppBarContextV2';
import { EmptyState } from '@/components/Base';
import OrderCard from './parts/OrderCard';
import OrderDetailModal from './parts/OrderDetailModal';
import OrderCardSkeleton from './parts/OrderCardSkeleton';
import { Order } from '@/services/order';
import { OrderDetail } from '@/types';
import { Receipt } from 'lucide-react';
import { useTranslations } from '@/hooks/useI18n';

export default function OrdersPage() {
    const { setAppBar, resetAppBar } = useAppBarV2();
    const router = useRouter();
    const t = useTranslations('orders');
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: orders, isLoading, error } = useQuery<OrderDetail[], Error>({
        queryKey: ['orders'],
        queryFn: Order.getOrderDetails
    });

    useEffect(() => {
        setAppBar({
            title: t('my_orders'),
            subtitle: t('history_and_status'),
            showSearch: false,
            showBackButton: true,
            centerTitle: true,
            rightContent: null
        });

        return () => resetAppBar();
    }, [setAppBar, resetAppBar, t]);

    const handleOrderClick = (order: OrderDetail) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
    };

    const handleBrowseOutlets = () => {
        router.push('/nearby');
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <OrderCardSkeleton key={i} />)}
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                    <EmptyState
                        title={t('error_title')}
                        description={t('error_message')}
                        icon={<Receipt className="w-6 h-6 text-muted-foreground" />}
                    />
                </div>
            );
        }

        if (!orders || orders.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                    <EmptyState
                        title={t('no_orders_title')}
                        description={t('no_orders_description')}
                        icon={<Receipt className="w-6 h-6 text-muted-foreground" />}
                        action={{
                            label: t('explore_outlets'),
                            onClick: handleBrowseOutlets
                        }}
                    />
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {orders.map((order) => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        onClick={() => handleOrderClick(order)}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-2">
            {!isLoading && orders && orders.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {orders.length} {orders.length === 1 ? t('order_singular') : t('order_plural')} {t('found')}
                    </p>
                </div>
            )}
            {renderContent()}
            <OrderDetailModal
                order={selectedOrder}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </div>
    );
}

