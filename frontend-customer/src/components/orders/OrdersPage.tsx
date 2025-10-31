'use client'

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAppBarV2 } from '@/context/AppBarContextV2';
import { EmptyState, ErrorState } from '@/components/Base';
import OrderCardSkeleton from './parts/OrderCardSkeleton';
import { Order } from '@/services/order';
import { OrderDetail, OrderStatus } from '@/types';
import { Receipt, RefreshCw, Loader2 } from 'lucide-react';
type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];
import { useTranslations } from '@/hooks/useI18n';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { useProfileInfo } from '@/hooks/useProfileInfo';
import { AxiosError } from 'axios';
import { groupOrdersByDate, sortOrdersByDate } from '@/lib/dateGrouping';
import { useSnackbar } from '@/hooks/useSnackbar';
import { useDebounce } from '@/hooks/useDebounce';

// Dynamic imports
const EnhancedOrderCard = dynamic(() => import('./parts/EnhancedOrderCard'), {
    ssr: false,
    loading: () => <OrderCardSkeleton />
});

const OrderBottomSheet = dynamic(() => import('./parts/OrderBottomSheet'), {
    ssr: false,
});

const StatusTabs = dynamic(() => import('./parts/StatusTabs'), {
    ssr: false,
});

const DateGroupHeader = dynamic(() => import('./parts/DateGroupHeader'), {
    ssr: false,
});

const SearchBar = dynamic(() => import('./parts/SearchBar'), {
    ssr: false,
});

const SortMenu = dynamic(() => import('./parts/SortMenu'), {
    ssr: false,
});

export type SortOption = 'newest' | 'oldest' | 'price-high' | 'price-low';

export default function OrdersPage() {
    const { setAppBar, resetAppBar } = useAppBarV2();
    const router = useRouter();
    const t = useTranslations('orders');
    const snackbar = useSnackbar();
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(10);
    const [activeTab, setActiveTab] = useState<OrderStatusType | 'ALL'>('ALL');
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const { profileUser } = useProfileInfo()

    // Debounce search query
    const debouncedSearch = useDebounce(searchQuery, 300)

    const { data: orders, isLoading, error, refetch } = useQuery<OrderDetail[], Error>({
        queryKey: ['orders'],
        queryFn: Order.getOrderDetails
    });

    console.log(error);


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

    // Filter orders by status
    const statusFilteredOrders = useMemo(() => {
        if (!orders) return [];
        if (activeTab === 'ALL') return orders;
        return orders.filter(order => order.orderStatus === activeTab);
    }, [orders, activeTab]);

    // Search orders
    const searchedOrders = useMemo(() => {
        if (!debouncedSearch.trim()) return statusFilteredOrders;

        const query = debouncedSearch.toLowerCase();
        return statusFilteredOrders.filter(order => {
            // Search by Order ID
            if (order.id.toLowerCase().includes(query)) return true;

            // Search by outlet name
            if (order.outlet.name.toLowerCase().includes(query)) return true;

            // Search by product names
            const hasMatchingProduct = order.items.some(item =>
                item.product.name.toLowerCase().includes(query)
            );
            if (hasMatchingProduct) return true;

            return false;
        });
    }, [statusFilteredOrders, debouncedSearch]);

    // Sort orders
    const sortedOrders = useMemo(() => {
        const ordersCopy = [...searchedOrders];

        switch (sortBy) {
            case 'newest':
                return sortOrdersByDate(ordersCopy, true); // descending
            case 'oldest':
                return sortOrdersByDate(ordersCopy, false); // ascending
            case 'price-high':
                return ordersCopy.sort((a, b) => b.totalAmount - a.totalAmount);
            case 'price-low':
                return ordersCopy.sort((a, b) => a.totalAmount - b.totalAmount);
            default:
                return sortOrdersByDate(ordersCopy, true);
        }
    }, [searchedOrders, sortBy]);

    // Group orders by date
    const groupedOrders = useMemo(() => {
        return groupOrdersByDate(sortedOrders);
    }, [sortedOrders]);

    // Count orders by status for tabs
    const statusCounts = useMemo(() => {
        if (!orders) return {};

        const counts: Record<string, number> = {
            ALL: orders.length
        };

        orders.forEach(order => {
            counts[order.orderStatus] = (counts[order.orderStatus] || 0) + 1;
        });

        return counts;
    }, [orders]);

    // Toggle group collapse
    const toggleGroup = (groupKey: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupKey)) {
                next.delete(groupKey);
            } else {
                next.add(groupKey);
            }
            return next;
        });
    };

    // Handle order actions
    const handleOrderAction = (action: 'contact' | 'cancel' | 'reorder' | 'confirm', order: OrderDetail) => {
        switch (action) {
            case 'contact':
                snackbar.info(t('messages.contactSoon'));
                break;
            case 'cancel':
                snackbar.info(t('messages.cancelSoon'));
                break;
            case 'reorder':
                snackbar.info(t('messages.reorderSoon'));
                break;
            case 'confirm':
                snackbar.info(t('messages.confirmSoon'));
                break;
        }
    };

    const renderContent = () => {
        if (!profileUser?.phone) return <ErrorState
            title='No Ponsel Belum di Setting'
            message='Silahkan setting terlebih dahulu pada halaman profile.'
        />

        if (isLoading) {
            return (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <OrderCardSkeleton key={i} />)}
                </div>
            );
        }

        if (error && (error as AxiosError).status == 404) {
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
            <div className="space-y-4">
                {groupedOrders.map(group => {
                    const isCollapsed = collapsedGroups.has(group.key);

                    return (
                        <div key={group.key} className="space-y-2">
                            <DateGroupHeader
                                label={group.label}
                                count={group.orders.length}
                                isCollapsed={isCollapsed}
                                onToggle={() => toggleGroup(group.key)}
                            />

                            {!isCollapsed && (
                                <div className="space-y-3">
                                    {group.orders.map((order) => (
                                        <EnhancedOrderCard
                                            key={order.id}
                                            order={order}
                                            onClick={() => handleOrderClick(order)}
                                            onQuickAction={handleOrderAction}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Status Tabs */}
            {!isLoading && orders && orders.length > 0 && (
                <StatusTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    counts={statusCounts}
                />
            )}

            {/* Search & Sort Bar */}
            {!isLoading && orders && orders.length > 0 && (
                <div className="flex items-center gap-2 px-1">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        className="flex-1"
                    />
                    <SortMenu
                        value={sortBy}
                        onChange={setSortBy}
                    />
                </div>
            )}

            {/* Order Count Summary */}
            {!isLoading && sortedOrders.length > 0 && (
                <div className="flex items-center justify-between px-1">
                    <p className="text-sm text-muted-foreground">
                        {sortedOrders.length} {sortedOrders.length === 1 ? t('order_singular') : t('order_plural')} {t('found')}
                    </p>
                </div>
            )}

            {/* No search results */}
            {!isLoading && debouncedSearch && sortedOrders.length === 0 && statusFilteredOrders.length > 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                    <p className="text-sm text-muted-foreground text-center">
                        {t('search.noResults').replace('{query}', debouncedSearch)}
                    </p>
                    <Button
                        variant="link"
                        onClick={() => setSearchQuery('')}
                        className="mt-2"
                    >
                        {t('search.clearSearch') || 'Clear search'}
                    </Button>
                </div>
            )}

            {/* Content */}
            {renderContent()}

            {/* Bottom Sheet for Order Details */}
            <OrderBottomSheet
                order={selectedOrder}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onAction={handleOrderAction}
            />
        </div>
    );
}

