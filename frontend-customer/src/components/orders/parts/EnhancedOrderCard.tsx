"use client";

import { memo, type ComponentType } from "react";
import { OrderDetail, OrderStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import {
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
    Ticket,
    ShoppingBag,
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
        accentBar: "bg-yellow-400",
        iconBg: "bg-yellow-100 dark:bg-yellow-900/40",
        iconColor: "text-yellow-600 dark:text-yellow-400",
    },
    [OrderStatus.PROCESSING]: {
        icon: Clock,
        dotColor: "bg-blue-500",
        textColor: "text-blue-700 dark:text-blue-400",
        badgeBg: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
        accentBar: "bg-blue-400",
        iconBg: "bg-blue-100 dark:bg-blue-900/40",
        iconColor: "text-blue-600 dark:text-blue-400",
    },
    [OrderStatus.CONFIRMED]: {
        icon: CheckCircle2,
        dotColor: "bg-cyan-500",
        textColor: "text-cyan-700 dark:text-cyan-400",
        badgeBg: "bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800",
        accentBar: "bg-cyan-400",
        iconBg: "bg-cyan-100 dark:bg-cyan-900/40",
        iconColor: "text-cyan-600 dark:text-cyan-400",
    },
    [OrderStatus.READY]: {
        icon: PackageCheck,
        dotColor: "bg-green-500",
        textColor: "text-green-700 dark:text-green-400",
        badgeBg: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800",
        accentBar: "bg-green-400",
        iconBg: "bg-green-100 dark:bg-green-900/40",
        iconColor: "text-green-600 dark:text-green-400",
    },
    [OrderStatus.ON_GOING]: {
        icon: Play,
        dotColor: "bg-orange-500",
        textColor: "text-orange-700 dark:text-orange-400",
        badgeBg: "bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800",
        accentBar: "bg-orange-400",
        iconBg: "bg-orange-100 dark:bg-orange-900/40",
        iconColor: "text-orange-600 dark:text-orange-400",
    },
    [OrderStatus.COMPLETED]: {
        icon: CheckCircle2,
        dotColor: "bg-primary",
        textColor: "text-primary",
        badgeBg: "bg-primary/5 border-primary/20",
        accentBar: "bg-primary",
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
    },
    [OrderStatus.CANCELLED]: {
        icon: XCircle,
        dotColor: "bg-destructive",
        textColor: "text-destructive",
        badgeBg: "bg-destructive/5 border-destructive/20",
        accentBar: "bg-destructive",
        iconBg: "bg-destructive/10",
        iconColor: "text-destructive",
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

export const EnhancedOrderCard = memo(function EnhancedOrderCard({
    order,
    onOrderClick,
    onQuickAction,
    pendingAction,
}: EnhancedOrderCardProps) {
    const t = useTranslations("orders");

    const status = STATUS_CONFIG[order.orderStatus] ?? STATUS_CONFIG[OrderStatus.PROCESSING];
    const StatusIcon = status.icon;

    const isAwaitingVerification =
        order.orderStatus === OrderStatus.AWAITING_PAYMENT &&
        (order.transaction?.status === "AWAITING_VERIFICATION" ||
            order.transaction?.status === "PROOF_SUBMITTED");

    const hasServiceProduct = order.items.some((i) => i.product.type === "SERVICE");

    const statusLabels: Record<string, string> = {
        [OrderStatus.AWAITING_PAYMENT]: isAwaitingVerification
            ? t("status.awaiting_verification")
            : t("status.awaiting_payment"),
        [OrderStatus.PROCESSING]: t("status.processing"),
        [OrderStatus.CONFIRMED]: t("status.confirmed_label"),
        [OrderStatus.READY]: hasServiceProduct
            ? t("status.ready_service_label")
            : t("status.ready_label"),
        [OrderStatus.ON_GOING]: t("status.on_going_label"),
        [OrderStatus.COMPLETED]: t("status.completed_label"),
        [OrderStatus.CANCELLED]: t("status.cancelled_label"),
    };

    const dateStr = `${formatShortDate(order.createdAt)} • ${formatShortTime(order.createdAt)}`;
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const visibleItems = order.items.slice(0, MAX_VISIBLE_ITEMS);
    const remainingCount = Math.max(0, order.items.length - MAX_VISIBLE_ITEMS);
    const hasTicketItems = order.items.some(
        (i) => i.product.type === "TICKET" && i.ticketCodes?.length,
    );
    const ticketCodeCount = order.items.reduce(
        (sum, i) => sum + (i.ticketCodes?.length ?? 0),
        0,
    );

    const isCalendarEligible =
        hasServiceProduct &&
        (order.orderStatus === OrderStatus.CONFIRMED ||
            order.orderStatus === OrderStatus.READY ||
            order.orderStatus === OrderStatus.ON_GOING);

    const showCountdown =
        order.orderStatus === OrderStatus.AWAITING_PAYMENT &&
        !isAwaitingVerification &&
        order.transaction?.expiryTime;

    const hasCancellationNote =
        order.orderStatus === OrderStatus.CANCELLED && order.cancellationReason;
    const hasRejectionNote = order.transaction?.status === "REJECTED_MANUAL";

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
                if (!isAwaitingVerification) {
                    actions.push(
                        { label: t("actions.pay"), icon: null, action: "pay", variant: "default" },
                        { label: t("actions.cancel"), icon: null, action: "cancel", variant: "outline" },
                    );
                } else {
                    actions.push({
                        label: t("actions.contact"),
                        icon: Phone,
                        action: "contact",
                        variant: "outline",
                    });
                }
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
                actions.push({
                    label: t("actions.contact"),
                    icon: Phone,
                    action: "contact",
                    variant: "outline",
                });
                if (!hasServiceProduct) {
                    actions.push({
                        label: t("actions.confirm"),
                        icon: CheckCircle2,
                        action: "confirm",
                        variant: "default",
                    });
                }
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
        <Card
            className={cn(
                "overflow-hidden gap-0 transition-all duration-200 p-0",
                "border border-border/60",
                "hover:border-border hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
                "active:scale-[0.995]",
                "sm:shadow-[inset_3px_0_0_transparent]",
            )}
        >
            {/* Colored top accent bar — status indicator */}
            <div className={cn("h-0.5 w-full", status.accentBar)} />

            <CardContent className="p-0">
                <div
                    onClick={() => onOrderClick(order)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && onOrderClick(order)}
                    aria-label={`Order dari ${order.outlet.name}, ${statusLabels[order.orderStatus]}`}
                    className={cn(
                        "cursor-pointer select-none",
                        "hover:bg-muted/30 active:bg-muted/60",
                        "transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                        "p-4 sm:p-5 flex flex-col gap-3.5",
                    )}
                >
                    {/* ── Header: outlet + status ──────────────────────── */}
                    <div className="flex items-center justify-between gap-2.5">
                        {/* Left: icon + outlet info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                                className={cn(
                                    "w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0",
                                    status.iconBg,
                                )}
                            >
                                <StatusIcon className={cn("w-5 h-5", status.iconColor)} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm sm:text-[15px] truncate text-foreground leading-tight">
                                    {order.outlet.name}
                                </h3>
                                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 font-medium">
                                    {dateStr}
                                </p>
                            </div>
                        </div>

                        {/* Right: status badge + chevron */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
                                    "text-[10px] sm:text-[11px] font-semibold border whitespace-nowrap",
                                    status.badgeBg,
                                    status.textColor,
                                )}
                            >
                                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", status.dotColor)} />
                                {statusLabels[order.orderStatus] || order.orderStatus}
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0 hidden sm:block" />
                        </div>
                    </div>

                    {/* ── Items box ────────────────────────────────────── */}
                    <div
                        className={cn(
                            "rounded-xl border border-border/50 bg-muted/20",
                            "p-3 sm:p-3.5 flex flex-col gap-2",
                        )}
                    >
                        {/* Ticket badge */}
                        {hasTicketItems && (
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
                                        "text-[10px] font-semibold border",
                                        "bg-emerald-50 dark:bg-emerald-900/30",
                                        "border-emerald-200 dark:border-emerald-800",
                                        "text-emerald-700 dark:text-emerald-400",
                                    )}
                                >
                                    <Ticket className="w-3 h-3" />
                                    {ticketCodeCount} tiket
                                </span>
                            </div>
                        )}

                        {/* Item rows */}
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                            {visibleItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-3 text-sm"
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {/* qty pill */}
                                        <span
                                            className={cn(
                                                "inline-flex items-center justify-center",
                                                "w-6 h-6 rounded-md shrink-0",
                                                "bg-background border border-border/60",
                                                "text-[11px] font-bold text-foreground",
                                            )}
                                        >
                                            {item.quantity}
                                        </span>
                                        <span className="truncate text-muted-foreground text-[13px] sm:text-sm font-medium">
                                            {item.product.name}
                                        </span>
                                    </div>
                                    <span className="text-[13px] sm:text-sm text-foreground font-semibold tabular-nums shrink-0">
                                        {formatCurrency(item.priceAtTimeOfOrder * item.quantity)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Remaining items */}
                        {remainingCount > 0 && (
                            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                                <ShoppingBag className="w-3 h-3 shrink-0" />
                                +{remainingCount} {t("and_more_items", { count: remainingCount })}
                            </p>
                        )}
                    </div>

                    {/* ── Alert: cancellation / rejection ──────────────── */}
                    {(hasCancellationNote || hasRejectionNote) && (
                        <div
                            className={cn(
                                "flex items-start gap-2.5 px-3 py-2.5 rounded-xl",
                                "bg-destructive/8 border border-destructive/20",
                            )}
                        >
                            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-[1px]" />
                            <p className="text-xs sm:text-[13px] text-destructive line-clamp-2 leading-relaxed font-medium">
                                {hasCancellationNote
                                    ? order.cancellationReason
                                    : order.transaction?.rejectionNote || "Bukti pembayaran ditolak"}
                            </p>
                        </div>
                    )}

                    {/* ── Countdown timer ───────────────────────────────── */}
                    {showCountdown && (
                        <div className="-mt-1">
                            <CountdownTimer expiryTime={order.transaction!.expiryTime!} compact />
                        </div>
                    )}

                    {/* ── Footer: order ID + total ──────────────────────── */}
                    <div
                        className={cn(
                            "flex items-end justify-between pt-1",
                            "border-t border-border/40",
                        )}
                    >
                        {/* Order ID */}
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                                Order ID
                            </span>
                            <span className="text-xs sm:text-[13px] font-mono font-bold text-foreground">
                                #{order.id.split("-")[0]}
                            </span>
                        </div>

                        {/* Total */}
                        <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">
                                Total ({totalItems} item)
                            </span>
                            <span className="text-base sm:text-lg font-extrabold text-foreground tabular-nums leading-tight tracking-tight">
                                {formatCurrency(order.totalAmount)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Quick Actions ─────────────────────────────────────── */}
                {quickActions.length > 0 && (
                    <div
                        className={cn(
                            "px-4 pb-4 sm:px-5 sm:pb-5",
                            "flex gap-2.5",
                            // On mobile: stack if more than 2 actions, else side-by-side
                            quickActions.length > 2 ? "flex-col sm:flex-row" : "flex-row",
                        )}
                    >
                        {quickActions.map((action, idx) => {
                            const ActionIcon = action.icon;
                            const isActionLoading =
                                isBusy && pendingAction?.action === action.action;

                            return (
                                <Button
                                    key={idx}
                                    size="sm"
                                    variant={action.variant}
                                    className={cn(
                                        "flex-1 font-semibold text-sm",
                                        // Taller touch target on mobile
                                        "h-10 sm:h-9",
                                        // Primary action gets a slight glow on dark
                                        action.variant === "default" &&
                                        "shadow-[0_2px_12px_rgba(0,0,0,0.15)]",
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onQuickAction?.(action.action, order);
                                    }}
                                    disabled={isBusy}
                                >
                                    {isActionLoading ? (
                                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                    ) : ActionIcon ? (
                                        <ActionIcon className="w-3.5 h-3.5 mr-2" />
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
});