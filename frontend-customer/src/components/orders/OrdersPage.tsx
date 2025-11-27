'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppBarV2 } from '@/context/AppBarContextV2';
import { EmptyState, ErrorState } from '@/components/Base';
import { ConfirmationModal } from '@/components/base/ConfirmationModal';
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
import { useCart } from '@/hooks/useCart';
import { Product } from '@/services/product';

const DEFAULT_SERVICE_DURATION_MINUTES = 60;

const escapeICSValue = (value: string) =>
    value
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;');

const formatICSDate = (date: Date) => {
    const iso = date.toISOString().replace(/[-:]/g, '');
    const [base] = iso.split('.');
    return `${base}Z`;
};

const getOrderScheduleWindow = (order: OrderDetail) => {
    const startCandidate = order.bookingSlot?.startTime
        ?? order.queueMeta?.scheduledStart
        ?? order.bookingDate
        ?? null;

    if (!startCandidate) {
        return { start: null as Date | null, end: null as Date | null };
    }

    const start = new Date(startCandidate);
    if (Number.isNaN(start.getTime())) {
        return { start: null, end: null };
    }

    const endCandidate = order.bookingSlot?.endTime ?? order.queueMeta?.scheduledEnd ?? null;
    if (endCandidate) {
        const end = new Date(endCandidate);
        return Number.isNaN(end.getTime()) ? { start: null, end: null } : { start, end };
    }

    const duration = order.items.find(item => item.product.type === 'SERVICE')?.product.serviceDurationMinutes ?? DEFAULT_SERVICE_DURATION_MINUTES;
    const fallbackEnd = new Date(start);
    fallbackEnd.setMinutes(fallbackEnd.getMinutes() + duration);
    return { start, end: fallbackEnd };
};

const generateIcsContent = (order: OrderDetail) => {
    const { start, end } = getOrderScheduleWindow(order);
    if (!start || !end) {
        return null;
    }

    const primaryItem = order.items.find(item => item.product.type === 'SERVICE') ?? order.items[0];
    const summary = primaryItem ? `${primaryItem.product.name} – ${order.outlet.name}` : `Booking – ${order.outlet.name}`;

    const details = [
        `Order ID: ${order.id}`,
        `Customer: ${order.customerDetails.name}`,
        `Phone: ${order.customerDetails.phone}`,
        `Outlet: ${order.outlet.name}`,
    ];

    const description = details.join('\n');
    const location = order.outlet.address || order.outlet.name;

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//ProjectBoss//CustomerApp//EN',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `UID:${order.id}@projectboss`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        `DTSTART:${formatICSDate(start)}`,
        `DTEND:${formatICSDate(end)}`,
        `SUMMARY:${escapeICSValue(summary)}`,
        `DESCRIPTION:${escapeICSValue(description)}`,
        `LOCATION:${escapeICSValue(location)}`,
        'END:VEVENT',
        'END:VCALENDAR',
    ];

    return lines.join('\r\n');
};

const triggerCalendarDownload = (order: OrderDetail) => {
    const ics = generateIcsContent(order);
    if (!ics) {
        return false;
    }

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `order-${order.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
};

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

type OrderAction = 'contact' | 'cancel' | 'reorder' | 'confirm' | 'pay' | 'calendar';

type CustomerNotificationPayload = {
    orderId?: string;
    status?: string;
    transactionStatus?: string;
    type?: string;
};

const isOrderStatusValue = (value: string | undefined | null): value is OrderStatusType => {
    if (!value) return false;
    return (Object.values(OrderStatus) as OrderStatusType[]).includes(value as OrderStatusType);
};

export default function OrdersPage() {
    const { setAppBar, resetAppBar } = useAppBarV2();
    const router = useRouter();
    const t = useTranslations('orders');
    const snackbar = useSnackbar();
    const queryClient = useQueryClient();
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<OrderStatusType | 'ALL'>('ALL');
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [actionInProgress, setActionInProgress] = useState<{ orderId: string; action: OrderAction } | null>(null);
    const [confirmationState, setConfirmationState] = useState<{ order: OrderDetail; action: Extract<OrderAction, 'cancel' | 'confirm'> } | null>(null);
    const { profileUser } = useProfileInfo()
    const addItem = useCart(state => state.addItem);
    const clearOutletItems = useCart(state => state.clearOutletItems);
    const socketRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounce search query
    const debouncedSearch = useDebounce(searchQuery, 300)

    const { data: orders, isLoading, error, refetch } = useQuery<OrderDetail[], Error>({
        queryKey: ['orders'],
        queryFn: Order.getOrderDetails
    });

    const scheduleSocketRefetch = useCallback(() => {
        if (socketRefreshTimeoutRef.current) {
            return;
        }

        socketRefreshTimeoutRef.current = setTimeout(async () => {
            socketRefreshTimeoutRef.current = null;
            try {
                await refetch();
            } catch (socketRefetchError) {
                console.error('Failed to refresh orders after socket update', socketRefetchError);
            }
        }, 800);
    }, [refetch]);

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

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const handleNotification = (event: Event) => {
            const detail = (event as CustomEvent<CustomerNotificationPayload>).detail;
            if (!detail?.orderId) {
                scheduleSocketRefetch();
                return;
            }

            const nextStatusRaw = detail.status ?? detail.transactionStatus;
            const normalisedStatus = typeof nextStatusRaw === 'string' ? nextStatusRaw.toUpperCase() : undefined;

            if (isOrderStatusValue(normalisedStatus)) {
                const safeStatus = normalisedStatus;
                queryClient.setQueryData<OrderDetail[]>(['orders'], (previous) => {
                    if (!previous) {
                        return previous;
                    }

                    const index = previous.findIndex((order) => order.id === detail.orderId);
                    if (index === -1) {
                        return previous;
                    }

                    const existing = previous[index];
                    const updatedOrder: OrderDetail = {
                        ...existing,
                        orderStatus: safeStatus,
                        queueMeta: existing.queueMeta
                            ? { ...existing.queueMeta, status: safeStatus }
                            : existing.queueMeta,
                    };

                    const nextOrders = [...previous];
                    nextOrders[index] = updatedOrder;
                    return nextOrders;
                });
            }

            scheduleSocketRefetch();
        };

        window.addEventListener('customer-notification', handleNotification as EventListener);

        return () => {
            window.removeEventListener('customer-notification', handleNotification as EventListener);
            if (socketRefreshTimeoutRef.current) {
                clearTimeout(socketRefreshTimeoutRef.current);
                socketRefreshTimeoutRef.current = null;
            }
        };
    }, [queryClient, scheduleSocketRefetch]);

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

    const normalizePhoneNumber = (phone?: string | null) => {
        if (!phone) return '';
        const digitsOnly = phone.replace(/[^0-9]/g, '');
        if (digitsOnly.startsWith('62')) return digitsOnly;
        if (digitsOnly.startsWith('0')) return `62${digitsOnly.slice(1)}`;
        return digitsOnly;
    };

    const getErrorMessage = (err: unknown, fallback: string) => {
        if (err instanceof AxiosError) {
            const statusCode = err.response?.status;
            if (statusCode === 404) {
                return t('messages.errors.orderNotFound');
            }

            const responseMessage = (err.response?.data as any)?.message;
            if (typeof responseMessage === 'string') {
                const serverMessageHandlers: Record<string, () => string> = {
                    'Pesanan tidak ditemukan': () => t('messages.errors.orderNotFound'),
                    'Pesanan tidak ditemukan untuk nomor telepon ini': () => t('messages.errors.ownershipMismatch'),
                    'Pesanan tidak dapat dibatalkan pada status saat ini': () => t('messages.errors.notCancellable'),
                    'Konfirmasi hanya diperbolehkan untuk pesanan delivery': () => t('messages.errors.confirmDeliveryOnly'),
                    'Pesanan belum siap untuk dikonfirmasi': () => t('messages.errors.confirmNotReady'),
                };

                const handler = serverMessageHandlers[responseMessage];
                if (handler) {
                    return handler();
                }
            }

            if (err.message === 'Network Error') {
                return t('messages.errors.generic');
            }
        }

        if (err instanceof Error && err.message) {
            if (['PROFILE_NOT_FOUND', 'PHONE_NOT_FOUND'].includes(err.message)) {
                return t('messages.missingPhone');
            }
            if (err.message === 'FAILED_TO_ADD_ITEM') {
                return t('messages.reorderError');
            }
        }

        return fallback;
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

    const performOrderAction = async (action: OrderAction, order: OrderDetail) => {
        if (action === 'pay') {
            router.push(`/payment/${order.id}`);
            return;
        }

        if (action === 'contact') {
            const phone = order.outlet.phone || '';
            const normalized = normalizePhoneNumber(phone);

            if (!normalized) {
                snackbar.error(t('messages.contactUnavailable'));
                return;
            }

            const messageTemplate = t('messages.contactMessage')
                .replace('{orderId}', order.id)
                .replace('{outletName}', order.outlet.name);

            const waUrl = `https://wa.me/${normalized}?text=${encodeURIComponent(messageTemplate)}`;
            window.open(waUrl, '_blank', 'noopener,noreferrer');
            snackbar.info(t('messages.contactRedirect'));
            return;
        }

        if (action === 'calendar') {
            try {
                const created = triggerCalendarDownload(order);
                if (created) {
                    snackbar.success(t('messages.calendarSuccess'));
                } else {
                    snackbar.info(t('messages.calendarMissingSchedule'));
                }
            } catch (calendarError) {
                console.error('Failed to download calendar event', calendarError);
                snackbar.error(t('messages.calendarError'));
            }
            return;
        }

        if (!profileUser?.phone) {
            snackbar.error(t('messages.missingPhone'));
            return;
        }

        const customerPhone = normalizePhoneNumber(profileUser.phone);

        if (!customerPhone) {
            snackbar.error(t('messages.missingPhone'));
            return;
        }

        const shouldSetLoading = ['cancel', 'confirm', 'reorder'].includes(action);

        try {
            if (shouldSetLoading) {
                setActionInProgress({ orderId: order.id, action });
            }

            switch (action) {
                case 'cancel': {
                    await Order.cancelOrder(order.id, { phone: customerPhone });
                    snackbar.success(t('messages.cancelSuccess'));
                    await refetch();
                    handleCloseModal();
                    break;
                }
                case 'confirm': {
                    await Order.confirmOrder(order.id, { phone: customerPhone });
                    snackbar.success(t('messages.confirmSuccess'));
                    await refetch();
                    handleCloseModal();
                    break;
                }
                case 'reorder': {
                    if (order.items.length === 0) {
                        snackbar.info(t('messages.reorderEmpty'));
                        return;
                    }

                    const hasServiceItem = order.items.some(item => item.product.type === 'SERVICE');
                    if (hasServiceItem) {
                        snackbar.info(t('messages.reorderServiceUnsupported'));
                        return;
                    }

                    clearOutletItems(order.outletId);

                    for (const item of order.items) {
                        const productDetail = await Product.getDetail(item.product.id);
                        const added = addItem(order.outletId, order.outlet.name, productDetail, item.quantity);

                        if (!added) {
                            throw new Error('FAILED_TO_ADD_ITEM');
                        }
                    }

                    snackbar.success(t('messages.reorderSuccess'));
                    handleCloseModal();
                    router.push('/cart');
                    break;
                }
            }
        } catch (err) {
            const fallbackKey = action === 'cancel'
                ? 'messages.cancelError'
                : action === 'confirm'
                    ? 'messages.confirmError'
                    : 'messages.reorderError';

            snackbar.error(getErrorMessage(err, t(fallbackKey)));
        } finally {
            if (shouldSetLoading) {
                setActionInProgress(null);
            }
        }
    };

    const handleOrderAction = (action: OrderAction, order: OrderDetail) => {
        if (action === 'cancel' || action === 'confirm') {
            setConfirmationState({ action, order });
            return;
        }

        void performOrderAction(action, order);
    };

    const handleConfirmModal = () => {
        if (!confirmationState) return;
        const { action, order } = confirmationState;
        setConfirmationState(null);
        void performOrderAction(action, order);
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

        if (error) {
            const axiosError = error as AxiosError;

            if (axiosError.response?.status === 404) {
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

            return (
                <ErrorState
                    title={t('messages.errors.genericTitle')}
                    message={getErrorMessage(error, t('messages.errors.generic'))}
                />
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
                                            pendingAction={actionInProgress}
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

    const confirmationConfig = confirmationState
        ? confirmationState.action === 'cancel'
            ? {
                title: t('messages.confirmations.cancel.title'),
                message: t('messages.confirmations.cancel.message'),
                confirmText: t('messages.confirmations.cancel.confirm'),
                cancelText: t('messages.confirmations.cancel.cancel'),
                variant: 'destructive' as const,
            }
            : {
                title: t('messages.confirmations.confirm.title'),
                message: t('messages.confirmations.confirm.message'),
                confirmText: t('messages.confirmations.confirm.confirm'),
                cancelText: t('messages.confirmations.confirm.cancel'),
                variant: 'default' as const,
            }
        : null;

    const confirmationLoading = confirmationState
        ? actionInProgress?.orderId === confirmationState.order.id && actionInProgress?.action === confirmationState.action
        : false;

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
                pendingAction={actionInProgress}
            />

            <ConfirmationModal
                isOpen={Boolean(confirmationState)}
                onClose={() => setConfirmationState(null)}
                onConfirm={handleConfirmModal}
                title={confirmationConfig?.title ?? ''}
                message={confirmationConfig?.message ?? ''}
                confirmText={confirmationConfig?.confirmText}
                cancelText={confirmationConfig?.cancelText}
                variant={confirmationConfig?.variant ?? 'default'}
                isLoading={confirmationLoading}
            />
        </div>
    );
}

