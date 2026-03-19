"use client";

import { OrderDetail, OrderStatus, type OrderStatusType } from "@/types";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import {
    Clock,
    CreditCard,
    CheckCircle,
    XCircle,
    Hourglass,
    PackageCheck,
    Store,
    User,
    Phone,
    Copy,
    RefreshCw,
    MessageCircle,
    Play,
    Loader2,
    CalendarPlus,
    ListOrdered,
    AlertCircle,
    Wallet,
    CheckCircle2,
} from "lucide-react";
import { useSnackbar } from "@/hooks/useSnackbar";
import { useTranslations } from "@/hooks/useI18n";
import dynamic from "next/dynamic";

const CountdownTimer = dynamic(() => import("./CountdownTimer"), { ssr: false });
const TicketQRCard = dynamic(() => import("./TicketQRCard"), { ssr: false });

type ActionType =
    | "contact"
    | "cancel"
    | "reorder"
    | "confirm"
    | "pay"
    | "calendar";

interface OrderBottomSheetProps {
    order: OrderDetail | null;
    isOpen: boolean;
    onClose: () => void;
    onAction?: (action: ActionType, order: OrderDetail) => void;
    pendingAction?: { orderId: string; action: ActionType } | null;
}

const STATUS_MAP = {
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
        dotColor: "bg-red-500", // Disesuaikan dengan desain Card sebelumnya
        textColor: "text-red-500",
        badgeBg: "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20",
    },
    [OrderStatus.CANCELLED]: {
        icon: XCircle,
        dotColor: "bg-gray-500",
        textColor: "text-gray-600 dark:text-gray-400",
        badgeBg: "bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700",
    },
} as const;

export default function OrderBottomSheet({
    order,
    isOpen,
    onClose,
    onAction,
    pendingAction,
}: OrderBottomSheetProps) {
    const snackbar = useSnackbar();
    const t = useTranslations("orders");

    if (!order) return null;

    const hasServiceProduct = order.items.some(
        (item) => item.product.type === "SERVICE",
    );
    const hasTicketProduct = order.items.some(
        (item) => item.product.type === "TICKET",
    );
    const ticketItems = order.items.filter(
        (item) => item.product.type === "TICKET" && item.ticketCodes?.length,
    );
    const queueMeta = order.queueMeta ?? null;
    const scheduledStart =
        order.queueMeta?.scheduledStart ??
        order.bookingSlot?.startTime ??
        order.bookingDate ??
        null;
    const scheduleLabel = scheduledStart ? formatDateTime(scheduledStart) : null;

    const isCalendarEligible =
        hasServiceProduct &&
        (order.orderStatus === OrderStatus.CONFIRMED ||
            order.orderStatus === OrderStatus.READY ||
            order.orderStatus === OrderStatus.ON_GOING);

    const isCancelled = order.orderStatus === OrderStatus.CANCELLED;

    const isAwaitingVerification =
        order.orderStatus === OrderStatus.AWAITING_PAYMENT &&
        (order.transaction?.status === "AWAITING_VERIFICATION" ||
            order.transaction?.status === "PROOF_SUBMITTED");

    const effectiveOrderStatus = isAwaitingVerification ? "AWAITING_VERIFICATION" : order.orderStatus;

    // Context-aware timeline: different steps & labels for GOODS vs SERVICE
    const timelineSteps = hasServiceProduct
        ? [
            {
                status: OrderStatus.AWAITING_PAYMENT,
                label: t("timeline.awaiting_payment"),
            },
            {
                status: "AWAITING_VERIFICATION",
                label: t("timeline.awaiting_verification"),
            },
            { status: OrderStatus.PROCESSING, label: t("timeline.processing") },
            {
                status: OrderStatus.CONFIRMED,
                label: t("timeline.confirmed_service"),
            },
            { status: OrderStatus.READY, label: t("timeline.ready_service") },
            { status: OrderStatus.ON_GOING, label: t("timeline.on_going") },
            { status: OrderStatus.COMPLETED, label: t("timeline.completed") },
        ]
        : [
            {
                status: OrderStatus.AWAITING_PAYMENT,
                label: t("timeline.awaiting_payment"),
            },
            {
                status: "AWAITING_VERIFICATION",
                label: t("timeline.awaiting_verification"),
            },
            { status: OrderStatus.PROCESSING, label: t("timeline.processing") },
            { status: OrderStatus.CONFIRMED, label: t("timeline.confirmed") },
            { status: OrderStatus.READY, label: t("timeline.ready") },
            { status: OrderStatus.COMPLETED, label: t("timeline.completed") },
        ];

    const currentIndex = timelineSteps.findIndex(
        (s) => s.status === effectiveOrderStatus,
    );

    const statusLabels: Record<string, string> = {
        [OrderStatus.AWAITING_PAYMENT]: isAwaitingVerification ? t("status.awaiting_verification") : t("status.awaiting_payment"),
        [OrderStatus.PROCESSING]: t("status.processing"),
        [OrderStatus.CONFIRMED]: t("status.confirmed_label"),
        [OrderStatus.READY]: hasServiceProduct ? t("status.ready_service_label") : t("status.ready_label"),
        [OrderStatus.ON_GOING]: t("status.on_going_label"),
        [OrderStatus.COMPLETED]: t("status.completed_label"),
        [OrderStatus.CANCELLED]: t("status.cancelled_label"),
    };

    const status =
        STATUS_MAP[order.orderStatus] ?? STATUS_MAP[OrderStatus.PROCESSING];

    const subtotal = order.totalAmount - order.midtransFee - order.appFee;
    const showTransactionFee =
        order.midtransFee > 0 &&
        order.transaction?.paymentMethod !== "QRIS_OFFLINE" &&
        order.transaction?.paymentMethod !== "OWNER_TRANSFER";

    const isBusy = pendingAction?.orderId === order.id;

    const copyOrderId = () => {
        navigator.clipboard.writeText(order.id);
        snackbar.success(t("messages.orderIdCopied"));
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent
                side="bottom"
                className="h-[90vh] p-0 rounded-t-xl bg-background"
            >
                <ScrollArea className="h-full">
                    {/* Header */}
                    <SheetHeader className="px-4 pt-5 pb-3 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <SheetTitle className="text-lg leading-tight text-foreground">
                                    {t("detail.title")}
                                </SheetTitle>
                                <SheetDescription className="flex items-center gap-1.5 mt-1.5">
                                    <code className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                        #{order.id.slice(0, 12)}
                                    </code>
                                    <button
                                        onClick={copyOrderId}
                                        className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </SheetDescription>
                            </div>
                            <span
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0",
                                    status.badgeBg,
                                    status.textColor,
                                )}
                            >
                                <span
                                    className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        status.dotColor,
                                    )}
                                />
                                {statusLabels[order.orderStatus] || order.orderStatus}
                            </span>
                        </div>
                    </SheetHeader>

                    <div className="px-4 pb-6 space-y-4">
                        {/* Cancellation / Rejection Notes */}
                        {isCancelled && order.cancellationReason && (
                            <div className="px-3 py-2.5 rounded-md bg-destructive/10 border border-destructive/20">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[11px] font-semibold text-destructive mb-0.5">
                                            Alasan pembatalan
                                        </p>
                                        <p className="text-[11px] text-destructive/80 leading-relaxed font-medium">
                                            {order.cancellationReason}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {order.transaction?.status === "REJECTED_MANUAL" && (
                            <div className="px-3 py-2.5 rounded-md bg-destructive/10 border border-destructive/20">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[11px] font-semibold text-destructive mb-0.5">
                                            Bukti pembayaran ditolak
                                        </p>
                                        <p className="text-[11px] text-destructive/80 leading-relaxed font-medium">
                                            {order.transaction.rejectionNote || "Tidak ada alasan"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Countdown Timer for AWAITING_PAYMENT */}
                        {order.orderStatus === OrderStatus.AWAITING_PAYMENT && !isAwaitingVerification &&
                            order.transaction?.expiryTime && (
                                <CountdownTimer
                                    expiryTime={order.transaction.expiryTime}
                                    compact={false}
                                />
                            )}

                        {/* Timeline — horizontal stepper style */}
                        {!isCancelled && (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    {t("detail.progress")}
                                </p>

                                {/* Horizontal step indicators */}
                                <div className="flex items-center gap-0">
                                    {timelineSteps.map((step, idx) => {
                                        const isCompleted = idx <= currentIndex;
                                        const isCurrent = idx === currentIndex;
                                        const isLast = idx === timelineSteps.length - 1;

                                        return (
                                            <div
                                                key={step.status}
                                                className="flex items-center flex-1 min-w-0 last:flex-none"
                                            >
                                                <div className="flex flex-col items-center gap-1">
                                                    <div
                                                        className={cn(
                                                            "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all",
                                                            isCompleted
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-muted text-muted-foreground",
                                                            isCurrent && "ring-2 ring-primary/30",
                                                        )}
                                                    >
                                                        {isCompleted ? (
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <span className="text-[9px] font-bold">
                                                                {idx + 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            "text-[9px] text-center leading-tight max-w-[56px]",
                                                            isCurrent
                                                                ? "font-semibold text-foreground"
                                                                : "text-muted-foreground",
                                                        )}
                                                    >
                                                        {step.label}
                                                    </span>
                                                </div>
                                                {/* Connector line */}
                                                {!isLast && (
                                                    <div
                                                        className={cn(
                                                            "h-0.5 flex-1 mx-0.5 mt-[-14px]",
                                                            idx < currentIndex ? "bg-primary" : "bg-border",
                                                        )}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Current status timestamp */}
                                {currentIndex >= 0 && (
                                    <p className="text-[10px] text-muted-foreground text-center">
                                        {formatDateTime(order.updatedAt)}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Queue Info for Service Orders */}
                        {hasServiceProduct && queueMeta && (
                            <div className="rounded-md border p-3 bg-muted/30 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <ListOrdered className="w-3.5 h-3.5" />
                                        <span>{t("queue.positionLabel")}</span>
                                    </div>
                                    <span className="text-sm font-bold text-foreground">
                                        {queueMeta.position
                                            ? `#${queueMeta.position}`
                                            : t("queue.positionPending")}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                    <span>
                                        {queueMeta.totalAhead > 0
                                            ? t("queue.peopleAhead", {
                                                count: queueMeta.totalAhead,
                                            })
                                            : t("queue.noOneAhead")}
                                    </span>
                                    <span>
                                        {scheduleLabel
                                            ? t("queue.estimatedStart", { date: scheduleLabel })
                                            : t("queue.schedulePending")}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Outlet & Customer — combined row */}
                        <div className="rounded-md border overflow-hidden">
                            <div className="flex items-center gap-3 px-3 py-2.5 bg-muted/30">
                                <Store className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium text-foreground truncate">
                                    {order.outlet.name}
                                </span>
                            </div>
                            <div className="h-px bg-border" />
                            <div className="px-3 py-2.5 space-y-1.5">
                                <div className="flex items-center gap-2.5 text-xs">
                                    <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-foreground">{order.customerDetails.name}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs">
                                    <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground">
                                        {order.customerDetails.phone}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {t("detail.itemDetails")}
                            </p>
                            <div className="rounded-md border divide-y divide-border">
                                {order.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between px-3 py-2.5"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {item.product.name}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                {item.quantity} × {formatCurrency(item.priceAtTimeOfOrder)}
                                            </p>
                                        </div>
                                        <span className="text-sm font-semibold text-foreground ml-3 shrink-0">
                                            {formatCurrency(item.quantity * item.priceAtTimeOfOrder)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Ticket QR Codes */}
                        {hasTicketProduct && ticketItems.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Tiket Anda
                                </p>
                                <div className="space-y-3">
                                    {ticketItems.flatMap((item) =>
                                        (item.ticketCodes ?? []).map((tc, idx) => (
                                            <TicketQRCard
                                                key={tc.id}
                                                ticketCode={tc}
                                                productName={item.product.name}
                                                index={idx}
                                            />
                                        ))
                                    )}
                                </div>
                                <p className="text-[10px] text-muted-foreground text-center">
                                    Tunjukkan QR code saat datang ke lokasi event
                                </p>
                            </div>
                        )}

                        {/* Payment Summary */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {t("detail.paymentSummary")}
                            </p>
                            <div className="rounded-md border p-3 space-y-1.5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">
                                        {t("detail.subtotal")}
                                    </span>
                                    <span className="text-foreground">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">
                                        {t("detail.serviceFee")}
                                    </span>
                                    <span className="text-foreground">{formatCurrency(order.appFee)}</span>
                                </div>
                                {showTransactionFee && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">
                                            {t("detail.transactionFee")}
                                        </span>
                                        <span className="text-foreground">{formatCurrency(order.midtransFee)}</span>
                                    </div>
                                )}
                                <div className="h-px bg-border my-1" />
                                <div className="flex justify-between items-center pt-0.5">
                                    <span className="text-sm font-bold text-foreground">
                                        {t("detail.totalPayment")}
                                    </span>
                                    <span className="text-base font-bold text-primary">
                                        {formatCurrency(order.totalAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-md border bg-muted/20">
                            <Wallet className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-muted-foreground leading-tight">
                                    {t("detail.paymentMethod")}
                                </p>
                                <p className="text-xs font-medium text-foreground capitalize truncate">
                                    {order.transaction?.paymentMethod.replace(/_/g, " ") ||
                                        "Unknown"}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2 pt-2">
                            {/* Calendar action for service orders */}
                            {isCalendarEligible && (
                                <Button
                                    variant="outline"
                                    className="w-full h-9 text-xs"
                                    onClick={() => onAction?.("calendar", order)}
                                >
                                    <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />
                                    {t("actions.addToCalendar")}
                                </Button>
                            )}

                            {/* Pay button for awaiting payment */}
                            {order.orderStatus === OrderStatus.AWAITING_PAYMENT && !isAwaitingVerification && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="default"
                                        className="flex-1 h-9 text-xs"
                                        onClick={() => onAction?.("pay", order)}
                                        disabled={isBusy}
                                    >
                                        {t("actions.pay")}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-9 text-xs"
                                        onClick={() => onAction?.("cancel", order)}
                                        disabled={isBusy}
                                    >
                                        {isBusy && pendingAction?.action === "cancel" ? (
                                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                        ) : null}
                                        {t("actions.cancel")}
                                    </Button>
                                </div>
                            )}

                            {/* Contact for active orders */}
                            {order.orderStatus !== OrderStatus.CANCELLED &&
                                order.orderStatus !== OrderStatus.COMPLETED &&
                                (order.orderStatus !== OrderStatus.AWAITING_PAYMENT || isAwaitingVerification) && (
                                    <Button
                                        variant="outline"
                                        className="w-full h-9 text-xs"
                                        onClick={() => onAction?.("contact", order)}
                                        disabled={isBusy}
                                    >
                                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                                        {t("actions.contactOutlet")}
                                    </Button>
                                )}

                            {/* FIX LOGIC: Confirm button HANYA muncul jika bukan layanan (Service) */}
                            {order.orderStatus === OrderStatus.READY && !hasServiceProduct && (
                                <Button
                                    variant="default"
                                    className="w-full h-9 text-xs"
                                    onClick={() => onAction?.("confirm", order)}
                                    disabled={isBusy}
                                >
                                    {isBusy && pendingAction?.action === "confirm" ? (
                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                    )}
                                    {t("actions.confirm")}
                                </Button>
                            )}

                            {/* Reorder for completed/cancelled */}
                            {(order.orderStatus === OrderStatus.COMPLETED ||
                                order.orderStatus === OrderStatus.CANCELLED) && (
                                    <Button
                                        variant="outline"
                                        className="w-full h-9 text-xs"
                                        onClick={() => onAction?.("reorder", order)}
                                        disabled={isBusy}
                                    >
                                        {isBusy && pendingAction?.action === "reorder" ? (
                                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                        )}
                                        {t("actions.reorder")}
                                    </Button>
                                )}

                            {/* Close */}
                            <Button
                                variant="secondary"
                                className="w-full h-9 text-xs"
                                onClick={onClose}
                            >
                                {t("actions.close")}
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}