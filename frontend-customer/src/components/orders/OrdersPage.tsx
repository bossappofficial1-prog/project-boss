'use client'

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAppBarV2 } from '@/context/AppBarContextV2';
import { EmptyState } from '@/components/Base';
import OrderCardSkeleton from './parts/OrderCardSkeleton';
import { Order } from '@/services/order';
import { OrderDetail } from '@/types';
import { Receipt, RefreshCw, Loader2 } from 'lucide-react';
import { useTranslations } from '@/hooks/useI18n';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

const OrderCard = dynamic(() => import('./parts/OrderCard'), {
    ssr: false,
    loading: () => <OrderCardSkeleton />
});

const OrderDetailModal = dynamic(() => import('./parts/OrderDetailModal'), {
    ssr: false,
});

export default function OrdersPage() {
    const { setAppBar, resetAppBar } = useAppBarV2();
    const router = useRouter();
    const t = useTranslations('orders');
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(10);

    const { data: orders, isLoading, error, refetch } = useQuery<OrderDetail[], Error>({
        queryKey: ['orders'],
        queryFn: Order.getOrderDetails
    });

    useEffect(() => {
        setAppBar({
            title: t('my_orders'),
            subtitle: t('history_and_status'),
            showSearch: false,
            showBackButton: false,
            rightContent: (
                <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
            )
        });

        return () => resetAppBar();
    }, [setAppBar, resetAppBar, t, refetch, isLoading]);

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

    const visibleOrders = useMemo(() => (orders || []).slice(0, visibleCount), [orders, visibleCount]);

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
                {visibleOrders.map((order) => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        onClick={() => handleOrderClick(order)}
                    />
                ))}

                {visibleCount < (orders || []).length && (
                    <div className="flex justify-center pt-2">
                        <Button onClick={() => setVisibleCount((s) => s + 10)} variant="outline">
                            {"Load more"}
                        </Button>
                    </div>
                )}
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

