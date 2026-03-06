"use client";

import {
    useEffect,
    useState,
    useMemo,
    useRef,
    useCallback,
    useDeferredValue,
    startTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppBarV2 } from "@/context/AppBarContextV2";
import { EmptyState, ErrorState } from "@/components/Base";
import { ConfirmationModal } from "@/components/base/ConfirmationModal";
import OrderCardSkeleton from "./parts/OrderCardSkeleton";
import StatusTabs from "./parts/StatusTabs";
import DateGroupHeader from "./parts/DateGroupHeader";
import SearchBar from "./parts/SearchBar";
import SortMenu from "./parts/SortMenu";
import { Order } from "@/services/order";
import { OrderDetail, OrderStatus } from "@/types";
import { Receipt, RefreshCw, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useTranslations } from "@/hooks/useI18n";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { useProfileInfo } from "@/hooks/useProfileInfo";
import { AxiosError } from "axios";
import { groupOrdersByDate } from "@/lib/dateGrouping";
import { useSnackbar } from "@/hooks/useSnackbar";
import { useCart } from "@/hooks/useCart";
import { Product } from "@/services/product";

type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];

const DEFAULT_SERVICE_DURATION_MINUTES = 60;

// ICS helpers
const escapeICSValue = (value: string) =>
    value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

const formatICSDate = (date: Date) => {
    const iso = date.toISOString().replace(/[-:]/g, "");
    return `${iso.split(".")[0]}Z`;
};

const getOrderScheduleWindow = (order: OrderDetail) => {
    const startCandidate =
        order.bookingSlot?.startTime ?? order.queueMeta?.scheduledStart ?? order.bookingDate ?? null;

    if (!startCandidate) return { start: null as Date | null, end: null as Date | null };

    const start = new Date(startCandidate);
    if (Number.isNaN(start.getTime())) return { start: null, end: null };

    const endCandidate = order.bookingSlot?.endTime ?? order.queueMeta?.scheduledEnd ?? null;
    if (endCandidate) {
        const end = new Date(endCandidate);
        return Number.isNaN(end.getTime()) ? { start: null, end: null } : { start, end };
    }

    const duration =
        order.items.find((i) => i.product.type === "SERVICE")?.product.service?.durationMinutes ??
        DEFAULT_SERVICE_DURATION_MINUTES;
    const fallbackEnd = new Date(start);
    fallbackEnd.setMinutes(fallbackEnd.getMinutes() + duration);
    return { start, end: fallbackEnd };
};

const generateIcsContent = (order: OrderDetail) => {
    const { start, end } = getOrderScheduleWindow(order);
    if (!start || !end) return null;

    const primaryItem = order.items.find((i) => i.product.type === "SERVICE") ?? order.items[0];
    const summary = primaryItem
        ? `${primaryItem.product.name} – ${order.outlet.name}`
        : `Booking – ${order.outlet.name}`;

    const description = [
        `Order ID: ${order.id}`,
        `Customer: ${order.customerDetails.name}`,
        `Phone: ${order.customerDetails.phone}`,
        `Outlet: ${order.outlet.name}`,
    ].join("\\n");

    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//ProjectBoss//CustomerApp//EN",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        `UID:${order.id}@projectboss`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        `DTSTART:${formatICSDate(start)}`,
        `DTEND:${formatICSDate(end)}`,
        `SUMMARY:${escapeICSValue(summary)}`,
        `DESCRIPTION:${escapeICSValue(description)}`,
        `LOCATION:${escapeICSValue(order.outlet.address || order.outlet.name)}`,
        "END:VEVENT",
        "END:VCALENDAR",
    ].join("\r\n");
};

const triggerCalendarDownload = (order: OrderDetail) => {
    const ics = generateIcsContent(order);
    if (!ics) return false;

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `order-${order.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
};

// Dynamic import only for heavy components
const EnhancedOrderCard = dynamic<import("./parts/EnhancedOrderCard").EnhancedOrderCardProps>(
    () => import("./parts/EnhancedOrderCard"),
    {
        ssr: false,
        loading: () => <OrderCardSkeleton />,
    },
);

const OrderBottomSheet = dynamic(() => import("./parts/OrderBottomSheet"), {
    ssr: false,
});

export type SortOption = "newest" | "oldest" | "price-high" | "price-low";
type OrderAction = "contact" | "cancel" | "reorder" | "confirm" | "pay" | "calendar";

type CustomerNotificationPayload = {
    orderId?: string;
    status?: string;
    transactionStatus?: string;
    type?: string;
};

const ORDER_STATUS_VALUES = new Set(Object.values(OrderStatus));
const isOrderStatusValue = (v: string | undefined | null): v is OrderStatusType =>
    typeof v === "string" && ORDER_STATUS_VALUES.has(v as OrderStatusType);

const normalizePhone = (phone?: string | null) => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("62")) return digits;
    if (digits.startsWith("0")) return `62${digits.slice(1)}`;
    return digits;
};

export default function OrdersPage() {
    const { setAppBar, resetAppBar } = useAppBarV2();
    const router = useRouter();
    const t = useTranslations("orders");
    const snackbar = useSnackbar();
    const queryClient = useQueryClient();
    const { profileUser } = useProfileInfo();
    const addItem = useCart((s) => s.addItem);
    const clearOutletItems = useCart((s) => s.clearOutletItems);

    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<OrderStatusType | "ALL">("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [actionInProgress, setActionInProgress] = useState<{
        orderId: string;
        action: OrderAction;
    } | null>(null);
    const [confirmationState, setConfirmationState] = useState<{
        order: OrderDetail;
        action: Extract<OrderAction, "cancel" | "confirm">;
    } | null>(null);

    // useDeferredValue keeps input responsive while deferring expensive filtering
    const deferredSearch = useDeferredValue(searchQuery);
    const socketRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const {
        data: orders,
        isLoading,
        error,
        refetch,
    } = useQuery<OrderDetail[], Error>({
        queryKey: ["orders"],
        queryFn: Order.getOrderDetails,
        enabled: !!profileUser?.phone,
        staleTime: 1000 * 30,
        gcTime: 1000 * 60 * 10,
        refetchOnMount: "always",
        refetchOnReconnect: "always",
        refetchOnWindowFocus: "always",
        refetchInterval: 1000 * 60,
    });

    // Single combined memo: filter → search → sort → group (replaces 5 separate memos)
    const { filteredOrders, groupedOrders, statusCounts } = useMemo(() => {
        if (!orders?.length) {
            return {
                filteredOrders: [] as OrderDetail[],
                groupedOrders: [] as ReturnType<typeof groupOrdersByDate>,
                statusCounts: { ALL: 0 } as Record<string, number>,
            };
        }

        // Status counts from full dataset
        const counts: Record<string, number> = { ALL: orders.length };
        for (const o of orders) {
            counts[o.orderStatus] = (counts[o.orderStatus] || 0) + 1;
        }

        // 1. Filter by status
        let result = activeTab === "ALL" ? orders : orders.filter((o) => o.orderStatus === activeTab);

        // 2. Search
        const q = deferredSearch.trim().toLowerCase();
        if (q) {
            result = result.filter(
                (o) =>
                    o.id.toLowerCase().includes(q) ||
                    o.outlet.name.toLowerCase().includes(q) ||
                    o.items.some((i) => i.product.name.toLowerCase().includes(q)),
            );
        }

        // 3. Sort (create a copy to avoid mutating)
        const sorted = [...result];
        switch (sortBy) {
            case "newest":
                sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
            case "oldest":
                sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                break;
            case "price-high":
                sorted.sort((a, b) => b.totalAmount - a.totalAmount);
                break;
            case "price-low":
                sorted.sort((a, b) => a.totalAmount - b.totalAmount);
                break;
        }

        // 4. Group by date
        return {
            filteredOrders: sorted,
            groupedOrders: groupOrdersByDate(sorted),
            statusCounts: counts,
        };
    }, [orders, activeTab, deferredSearch, sortBy]);

    // Socket refresh with debounce
    const scheduleSocketRefetch = useCallback(() => {
        if (socketRefreshRef.current) return;
        socketRefreshRef.current = setTimeout(async () => {
            socketRefreshRef.current = null;
            try {
                await refetch();
            } catch {
                // silent fail for socket-triggered refresh
            }
        }, 800);
    }, [refetch]);

    // App bar setup
    useEffect(() => {
        setAppBar({
            title: t("my_orders"),
            subtitle: t("history_and_status"),
            showSearch: false,
            showBackButton: false,
            rightContent: (
                <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                </Button>
            ),
        });
        return () => resetAppBar();
    }, [setAppBar, resetAppBar, t, refetch, isLoading]);

    // Socket realtime updates
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleNotification = (event: Event) => {
            const detail = (event as CustomEvent<CustomerNotificationPayload>).detail;
            if (!detail?.orderId) {
                scheduleSocketRefetch();
                return;
            }

            const raw = detail.status ?? detail.transactionStatus;
            const normalized = typeof raw === "string" ? raw.toUpperCase() : undefined;

            if (isOrderStatusValue(normalized)) {
                queryClient.setQueryData<OrderDetail[]>(["orders"], (prev) => {
                    if (!prev) return prev;
                    const idx = prev.findIndex((o) => o.id === detail.orderId);
                    if (idx === -1) return prev;

                    const updated = [...prev];
                    updated[idx] = {
                        ...prev[idx],
                        orderStatus: normalized,
                        queueMeta: prev[idx].queueMeta
                            ? { ...prev[idx].queueMeta!, status: normalized }
                            : prev[idx].queueMeta,
                    };
                    return updated;
                });
            }

            scheduleSocketRefetch();
        };

        window.addEventListener("customer-notification", handleNotification as EventListener);
        return () => {
            window.removeEventListener("customer-notification", handleNotification as EventListener);
            if (socketRefreshRef.current) {
                clearTimeout(socketRefreshRef.current);
                socketRefreshRef.current = null;
            }
        };
    }, [queryClient, scheduleSocketRefetch]);

    // Stable handlers via useCallback
    const handleOrderClick = useCallback((order: OrderDetail) => {
        setSelectedOrder(order);
        setIsSheetOpen(true);
    }, []);

    const handleCloseSheet = useCallback(() => {
        setIsSheetOpen(false);
        setSelectedOrder(null);
    }, []);

    // startTransition keeps status tab switch non-blocking
    const handleTabChange = useCallback((tab: OrderStatusType | "ALL") => {
        startTransition(() => setActiveTab(tab));
    }, []);

    const getErrorMessage = useCallback(
        (err: unknown, fallback: string) => {
            if (err instanceof AxiosError) {
                if (err.response?.status === 404) return t("messages.errors.orderNotFound");
                const msg = (err.response?.data as any)?.message;
                if (typeof msg === "string") {
                    const map: Record<string, () => string> = {
                        "Pesanan tidak ditemukan": () => t("messages.errors.orderNotFound"),
                        "Pesanan tidak ditemukan untuk nomor telepon ini": () =>
                            t("messages.errors.ownershipMismatch"),
                        "Pesanan tidak dapat dibatalkan pada status saat ini": () =>
                            t("messages.errors.notCancellable"),
                        "Konfirmasi hanya diperbolehkan untuk pesanan delivery": () =>
                            t("messages.errors.confirmDeliveryOnly"),
                        "Pesanan belum siap untuk dikonfirmasi": () => t("messages.errors.confirmNotReady"),
                    };
                    if (map[msg]) return map[msg]();
                }
                if (err.message === "Network Error") return t("messages.errors.generic");
            }
            if (err instanceof Error) {
                if (["PROFILE_NOT_FOUND", "PHONE_NOT_FOUND"].includes(err.message))
                    return t("messages.missingPhone");
                if (err.message === "FAILED_TO_ADD_ITEM") return t("messages.reorderError");
            }
            return fallback;
        },
        [t],
    );

    const performAction = useCallback(
        async (action: OrderAction, order: OrderDetail) => {
            if (action === "pay") {
                router.push(`/payment/${order.id}`);
                return;
            }

            if (action === "contact") {
                const normalized = normalizePhone(order.outlet.phone);
                if (!normalized) {
                    snackbar.error(t("messages.contactUnavailable"));
                    return;
                }

                const itemsList = order.items
                    .map((i) => `  - ${i.product.name} x${i.quantity}`)
                    .join("\n");

                const scheduleInfo = (() => {
                    const raw =
                        order.bookingSlot?.startTime ??
                        order.queueMeta?.scheduledStart ??
                        null;
                    if (!raw) return "";
                    const date = new Date(raw);
                    if (Number.isNaN(date.getTime())) return "";
                    return `\n📅 *Jadwal:* ${date.toLocaleString("id-ID", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Jakarta",
                    })}`;
                })();

                const msg = [
                    `Halo *${order.outlet.name}*,`,
                    ``,
                    `Saya ingin menanyakan status pesanan saya berikut:`,
                    ``,
                    `📋 *No. Pesanan:* ${order.id}`,
                    `👤 *Nama:* ${order.customerDetails.name}`,
                    `📦 *Item Pesanan:*`,
                    itemsList,
                    `💰 *Total:* ${formatCurrency(order.totalAmount)}`,
                    scheduleInfo ? scheduleInfo.trimStart() : null,
                    ``,
                    `Mohon bantuannya. Terima kasih 🙏`,
                ]
                    .filter((line) => line !== null)
                    .join("\n");

                window.open(
                    `https://wa.me/${normalized}?text=${encodeURIComponent(msg)}`,
                    "_blank",
                    "noopener,noreferrer",
                );
                snackbar.info(t("messages.contactRedirect"));
                return;
            }

            if (action === "calendar") {
                try {
                    triggerCalendarDownload(order)
                        ? snackbar.success(t("messages.calendarSuccess"))
                        : snackbar.info(t("messages.calendarMissingSchedule"));
                } catch {
                    snackbar.error(t("messages.calendarError"));
                }
                return;
            }

            const phone = normalizePhone(profileUser?.phone);
            if (!phone) {
                snackbar.error(t("messages.missingPhone"));
                return;
            }

            try {
                setActionInProgress({ orderId: order.id, action });

                switch (action) {
                    case "cancel":
                        await Order.cancelOrder(order.id, { phone });
                        snackbar.success(t("messages.cancelSuccess"));
                        await refetch();
                        handleCloseSheet();
                        break;

                    case "confirm":
                        await Order.confirmOrder(order.id, { phone });
                        snackbar.success(t("messages.confirmSuccess"));
                        await refetch();
                        handleCloseSheet();
                        break;

                    case "reorder": {
                        if (!order.items.length) {
                            snackbar.info(t("messages.reorderEmpty"));
                            return;
                        }
                        if (order.items.some((i) => i.product.type === "SERVICE")) {
                            snackbar.info(t("messages.reorderServiceUnsupported"));
                            return;
                        }
                        clearOutletItems(order.outletId);
                        for (const item of order.items) {
                            const detail = await Product.getDetail(item.product.id);
                            if (
                                !addItem(
                                    order.outletId,
                                    order.outlet.name,
                                    order.outlet.slug!,
                                    detail,
                                    item.quantity,
                                )
                            ) {
                                throw new Error("FAILED_TO_ADD_ITEM");
                            }
                        }
                        snackbar.success(t("messages.reorderSuccess"));
                        handleCloseSheet();
                        router.push("/cart");
                        break;
                    }
                }
            } catch (err) {
                const key =
                    action === "cancel"
                        ? "messages.cancelError"
                        : action === "confirm"
                            ? "messages.confirmError"
                            : "messages.reorderError";
                snackbar.error(getErrorMessage(err, t(key)));
            } finally {
                setActionInProgress(null);
            }
        },
        [
            profileUser?.phone,
            router,
            snackbar,
            t,
            refetch,
            handleCloseSheet,
            clearOutletItems,
            addItem,
            getErrorMessage,
        ],
    );

    const handleOrderAction = useCallback(
        (action: OrderAction, order: OrderDetail) => {
            if (action === "cancel" || action === "confirm") {
                setConfirmationState({ action, order });
                return;
            }
            void performAction(action, order);
        },
        [performAction],
    );

    const handleConfirmModal = useCallback(() => {
        if (!confirmationState) return;
        const { action, order } = confirmationState;
        setConfirmationState(null);
        void performAction(action, order);
    }, [confirmationState, performAction]);

    // Derived state
    const hasOrders = !isLoading && orders && orders.length > 0;
    const noSearchResults =
        !isLoading &&
        deferredSearch.trim() &&
        filteredOrders.length === 0 &&
        (activeTab === "ALL" ? (orders?.length ?? 0) > 0 : (statusCounts[activeTab] ?? 0) > 0);

    const confirmationConfig = confirmationState
        ? confirmationState.action === "cancel"
            ? {
                title: t("messages.confirmations.cancel.title"),
                message: t("messages.confirmations.cancel.message"),
                confirmText: t("messages.confirmations.cancel.confirm"),
                cancelText: t("messages.confirmations.cancel.cancel"),
                variant: "destructive" as const,
            }
            : {
                title: t("messages.confirmations.confirm.title"),
                message: t("messages.confirmations.confirm.message"),
                confirmText: t("messages.confirmations.confirm.confirm"),
                cancelText: t("messages.confirmations.confirm.cancel"),
                variant: "default" as const,
            }
        : null;

    // Early return for missing phone
    if (!profileUser?.phone) {
        return (
            <ErrorState
                title="No Ponsel Belum di Setting"
                message="Silahkan setting terlebih dahulu pada halaman profile."
            />
        );
    }

    return (
        <div className="space-y-3">
            {/* Status Filter Chips */}
            {hasOrders && (
                <StatusTabs activeTab={activeTab} onTabChange={handleTabChange} counts={statusCounts} />
            )}

            {/* Search & Sort Toolbar */}
            {hasOrders && (
                <div className="flex items-center gap-2 px-1">
                    <SearchBar value={searchQuery} onChange={setSearchQuery} className="flex-1" />
                    <SortMenu value={sortBy} onChange={setSortBy} />
                </div>
            )}

            {/* Results Count */}
            {hasOrders && filteredOrders.length > 0 && (
                <p className="text-xs text-muted-foreground px-1">
                    {filteredOrders.length}{" "}
                    {filteredOrders.length === 1 ? t("order_singular") : t("order_plural")} {t("found")}
                </p>
            )}

            {/* No Search Results */}
            {noSearchResults && (
                <div className="flex flex-col items-center py-12 px-4">
                    <p className="text-sm text-muted-foreground text-center">
                        {t("search.noResults").replace("{query}", deferredSearch)}
                    </p>
                    <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
                        {t("search.clearSearch") || "Hapus pencarian"}
                    </Button>
                </div>
            )}

            {/* Loading Skeleton */}
            {isLoading && (
                <div className="space-y-3">
                    {Array.from({ length: 3 }, (_, i) => (
                        <OrderCardSkeleton key={i} />
                    ))}
                </div>
            )}

            {/* Error State */}
            {!isLoading &&
                error &&
                ((error as AxiosError).response?.status === 404 ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                        <EmptyState
                            title={t("error_title")}
                            description={t("error_message")}
                            icon={<Receipt className="w-6 h-6 text-muted-foreground" />}
                        />
                    </div>
                ) : (
                    <ErrorState
                        title={t("messages.errors.genericTitle")}
                        message={getErrorMessage(error, t("messages.errors.generic"))}
                    />
                ))}

            {/* Empty State */}
            {!isLoading && !error && orders && orders.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                    <EmptyState
                        title={t("no_orders_title")}
                        description={t("no_orders_description")}
                        icon={<Receipt className="w-6 h-6 text-muted-foreground" />}
                        action={{
                            label: t("explore_outlets"),
                            onClick: () => router.push("/nearby"),
                        }}
                    />
                </div>
            )}

            {/* Order Groups */}
            {!isLoading && !error && groupedOrders.length > 0 && (
                <div className="space-y-4">
                    {groupedOrders.map((group) => (
                        <div key={group.key} className="space-y-2">
                            <DateGroupHeader label={group.label} count={group.orders.length} />
                            <div className="space-y-3">
                                {group.orders.map((order) => (
                                    <EnhancedOrderCard
                                        key={order.id}
                                        order={order}
                                        onOrderClick={handleOrderClick}
                                        onQuickAction={handleOrderAction}
                                        pendingAction={actionInProgress}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Order Detail Bottom Sheet */}
            <OrderBottomSheet
                order={selectedOrder}
                isOpen={isSheetOpen}
                onClose={handleCloseSheet}
                onAction={handleOrderAction}
                pendingAction={actionInProgress}
            />

            {/* Confirmation Dialog */}
            <ConfirmationModal
                isOpen={Boolean(confirmationState)}
                onClose={() => setConfirmationState(null)}
                onConfirm={handleConfirmModal}
                title={confirmationConfig?.title ?? ""}
                message={confirmationConfig?.message ?? ""}
                confirmText={confirmationConfig?.confirmText}
                cancelText={confirmationConfig?.cancelText}
                variant={confirmationConfig?.variant ?? "default"}
                isLoading={
                    confirmationState
                        ? actionInProgress?.orderId === confirmationState.order.id &&
                        actionInProgress?.action === confirmationState.action
                        : false
                }
            />
        </div>
    );
}
