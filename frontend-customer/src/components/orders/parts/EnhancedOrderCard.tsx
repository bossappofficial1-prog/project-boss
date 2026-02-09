"use client";

import { memo, type ComponentType } from "react";
import { OrderDetail, OrderStatus, type OrderStatusType } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import {
    Store,
    Phone,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    Hourglass,
    PackageCheck,
    ChevronRight,
    Play,
    Loader2,
    CalendarPlus,
    AlertCircle,
} from "lucide-react";
import { useTranslations } from "@/hooks/useI18n";
import dynamic from "next/dynamic";

const CountdownTimer = dynamic(() => import("./CountdownTimer"), { ssr: false });

export type QuickActionType = "contact" | "cancel" | "reorder" | "confirm" | "pay" | "calendar";

export interface EnhancedOrderCardProps {
    order: OrderDetail;
    onOrderClick: (order: OrderDetail) => void;
    onQuickAction?: (action: QuickActionType, order: OrderDetail) => void;
    pendingAction?: { orderId: string; action: QuickActionType } | null;
}

type QuickActionConfig = {
    label: string;
    icon: ComponentType<{ className?: string }> | null;
    action: QuickActionType;
    variant: "default" | "outline";
};

const STATUS_CONFIG = {
    [OrderStatus.AWAITING_PAYMENT]: {
        icon: Hourglass,
        dotColor: "bg-yellow-500",
        textColor: "text-yellow-700 dark:text-yellow-400",
        badgeBg: "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800",
    },
    [OrderStatus.PROCESSING]: {
        icon: Clock,
        dotColor: "bg-blue-500",
        textColor: "text-blue-700 dark:text-blue-400",
        badgeBg: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
    },
    [OrderStatus.CONFIRMED]: {
        icon: CheckCircle2,
        dotColor: "bg-cyan-500",
        textColor: "text-cyan-700 dark:text-cyan-400",
        badgeBg: "bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800",
    },
    [OrderStatus.READY]: {
        icon: PackageCheck,
        dotColor: "bg-green-500",
        textColor: "text-green-700 dark:text-green-400",
        badgeBg: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800",
    },
    [OrderStatus.ON_GOING]: {
        icon: Play,
        dotColor: "bg-orange-500",
        textColor: "text-orange-700 dark:text-orange-400",
        badgeBg: "bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800",
    },
    [OrderStatus.COMPLETED]: {
        icon: CheckCircle2,
        dotColor: "bg-primary",
        textColor: "text-primary",
        badgeBg: "bg-primary/5 border-primary/20",
    },
    [OrderStatus.CANCELLED]: {
        icon: XCircle,
        dotColor: "bg-destructive",
        textColor: "text-destructive",
        badgeBg: "bg-destructive/5 border-destructive/20",
    },
} as const;

const MAX_VISIBLE_ITEMS = 2;

function formatShortDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function formatShortTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function EnhancedOrderCard({
    order,
    onOrderClick,
    onQuickAction,
    pendingAction,
}: EnhancedOrderCardProps) {
    const t = useTranslations("orders");

    const status = STATUS_CONFIG[order.orderStatus] ?? STATUS_CONFIG[OrderStatus.PROCESSING];
    const StatusIcon = status.icon;

    const statusLabels: Record<string, string> = {
        [OrderStatus.AWAITING_PAYMENT]: t("status.awaiting_payment"),
        [OrderStatus.PROCESSING]: t("status.processing"),
        [OrderStatus.CONFIRMED]: t("status.confirmed_label"),
        [OrderStatus.READY]: t("status.ready_label"),
        [OrderStatus.ON_GOING]: t("status.on_going_label"),
        [OrderStatus.COMPLETED]: t("status.completed_label"),
        [OrderStatus.CANCELLED]: t("status.cancelled_label"),
    };

    const dateStr = `${formatShortDate(order.createdAt)} • ${formatShortTime(order.createdAt)}`;
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const visibleItems = order.items.slice(0, MAX_VISIBLE_ITEMS);
    const remainingCount = Math.max(0, order.items.length - MAX_VISIBLE_ITEMS);

    const hasServiceProduct = order.items.some((i) => i.product.type === "SERVICE");
    const isCalendarEligible =
        hasServiceProduct &&
        (order.orderStatus === OrderStatus.CONFIRMED ||
            order.orderStatus === OrderStatus.READY ||
            order.orderStatus === OrderStatus.ON_GOING);

    const showCountdown =
        order.orderStatus === OrderStatus.AWAITING_PAYMENT && order.transaction?.expiryTime;

    const hasCancellationNote =
        order.orderStatus === OrderStatus.CANCELLED && order.cancellationReason;
    const hasRejectionNote = order.transaction?.status === "REJECTED_MANUAL";

    // Build quick actions
    const getQuickActions = (): QuickActionConfig[] => {
        const actions: QuickActionConfig[] = [];

        if (isCalendarEligible) {
            actions.push({
                label: t("actions.addToCalendar"),
                icon: CalendarPlus,
                action: "calendar",
                variant: "outline",
            });
        }

        switch (order.orderStatus) {
            case OrderStatus.AWAITING_PAYMENT:
                actions.push(
                    { label: t("actions.pay"), icon: null, action: "pay", variant: "default" },
                    { label: t("actions.cancel"), icon: null, action: "cancel", variant: "outline" },
                );
                break;
            case OrderStatus.PROCESSING:
            case OrderStatus.CONFIRMED:
                actions.push({
                    label: t("actions.contact"),
                    icon: Phone,
                    action: "contact",
                    variant: "outline",
                });
                break;
            case OrderStatus.READY:
                actions.push(
                    { label: t("actions.contact"), icon: Phone, action: "contact", variant: "outline" },
                    { label: t("actions.confirm"), icon: CheckCircle2, action: "confirm", variant: "default" },
                );
                break;
            case OrderStatus.ON_GOING:
                actions.push({
                    label: t("actions.contact"),
                    icon: Phone,
                    action: "contact",
                    variant: "outline",
                });
                break;
            case OrderStatus.COMPLETED:
            case OrderStatus.CANCELLED:
                actions.push({
                    label: t("actions.reorder"),
                    icon: RefreshCw,
                    action: "reorder",
                    variant: "outline",
                });
                break;
        }

        return actions;
    };

    const quickActions = getQuickActions();
    const isBusy = pendingAction?.orderId === order.id;

    return (
        <Card className="overflow-hidden rounded-md border shadow-sm p-0 transition-shadow hover:shadow-md">
            <CardContent className="p-0">
                {/* Clickable area */}
                <div
                    onClick={() => onOrderClick(order)}
                    className="cursor-pointer active:bg-accent/30 transition-colors"
                >
                    {/* Header: outlet + date */}
                    <div className="flex items-center gap-3 px-3 pt-3 pb-2">
                        <div className="bg-muted rounded-md p-1.5 shrink-0">
                            <Store className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{order.outlet.name}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{dateStr}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>

                    {/* Status Badge */}
                    <div className="px-3 pb-2">
                        <span
                            className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                                status.badgeBg,
                                status.textColor,
                            )}
                        >
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", status.dotColor)} />
                            {statusLabels[order.orderStatus] || order.orderStatus}
                        </span>
                    </div>

                    {/* Items list */}
                    <div className="px-3 pb-2 space-y-0.5">
                        {visibleItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-xs">
                                <span className="truncate flex-1 text-muted-foreground">
                                    <span className="font-medium text-foreground">{item.quantity}x</span>{" "}
                                    {item.product.name}
                                </span>
                                <span className="text-muted-foreground ml-2 shrink-0">
                                    {formatCurrency(item.priceAtTimeOfOrder * item.quantity)}
                                </span>
                            </div>
                        ))}
                        {remainingCount > 0 && (
                            <p className="text-[11px] text-muted-foreground italic">
                                +{remainingCount} {t("and_more_items", { count: remainingCount })}
                            </p>
                        )}
                    </div>

                    {/* Cancellation / Rejection note */}
                    {(hasCancellationNote || hasRejectionNote) && (
                        <div className="mx-3 mb-2 px-2.5 py-1.5 rounded-md bg-destructive/5 border border-destructive/10">
                            <div className="flex items-start gap-1.5">
                                <AlertCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                                <p className="text-[11px] text-destructive/80 line-clamp-2 leading-relaxed">
                                    {hasCancellationNote
                                        ? order.cancellationReason
                                        : order.transaction?.rejectionNote || "Bukti pembayaran ditolak"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Countdown timer */}
                    {showCountdown && (
                        <div className="px-3 pb-2">
                            <CountdownTimer expiryTime={order.transaction!.expiryTime!} compact />
                        </div>
                    )}

                    {/* Footer: ID + Total */}
                    <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/30">
                        <span className="text-[11px] text-muted-foreground font-mono">
                            #{order.id.slice(0, 8)}
                        </span>
                        <div className="text-right">
                            <span className="text-[10px] text-muted-foreground">
                                {totalItems} item{totalItems > 1 ? "s" : ""}
                            </span>
                            <p className="font-bold text-sm text-primary leading-tight">
                                {formatCurrency(order.totalAmount)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                {quickActions.length > 0 && (
                    <div className="px-3 pb-3 pt-1 flex gap-2">
                        {quickActions.map((action, idx) => {
                            const ActionIcon = action.icon;
                            const isActionLoading = isBusy && pendingAction?.action === action.action;

                            return (
                                <Button
                                    key={idx}
                                    size="sm"
                                    variant={action.variant}
                                    className="flex-1 h-8 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onQuickAction?.(action.action, order);
                                    }}
                                    disabled={isBusy}
                                >
                                    {isActionLoading ? (
                                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                    ) : ActionIcon ? (
                                        <ActionIcon className="w-3.5 h-3.5 mr-1" />
                                    ) : null}
                                    {action.label}
                                </Button>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default memo(EnhancedOrderCard);
