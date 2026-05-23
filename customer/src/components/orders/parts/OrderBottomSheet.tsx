"use client";

import { OrderDetail, OrderStatus } from "@/types";
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
    CheckCircle2,
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
    Receipt,
    Download,
} from "lucide-react";
import { useSnackbar } from "@/hooks/useSnackbar";
import { useTranslations } from "@/hooks/useI18n";
import dynamic from "next/dynamic";
import TimelineProgress from "./TimelineProgress";

const CountdownTimer = dynamic(() => import("./CountdownTimer"), { ssr: false });
const TicketQRCard = dynamic(() => import("./TicketQRCard"), { ssr: false });

type ActionType = "contact" | "cancel" | "reorder" | "confirm" | "pay" | "calendar" | "download_ticket";

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

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            {children}
        </p>
    );
}

function InfoRow({
    icon: Icon,
    label,
    value,
    mono = false,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label?: string;
    value: React.ReactNode;
    mono?: boolean;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
                {label && (
                    <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{label}</p>
                )}
                <p className={cn("text-sm font-medium text-foreground truncate", mono && "font-mono")}>
                    {value}
                </p>
            </div>
        </div>
    );
}

function AlertBanner({ title, message }: { title: string; message: string }) {
    return (
        <div className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-destructive/8 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-[1px]" />
            <div>
                <p className="text-xs font-semibold text-destructive leading-tight">{title}</p>
                <p className="text-xs text-destructive/80 mt-1 leading-relaxed">{message}</p>
            </div>
        </div>
    );
}

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

    const hasServiceProduct = order.items.some((item) => item.product.type === "SERVICE");
    const hasTicketProduct = order.items.some((item) => item.product.type === "TICKET");
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

    const timelineSteps = hasServiceProduct
        ? [
            { status: OrderStatus.AWAITING_PAYMENT, label: t("timeline.awaiting_payment") },
            { status: "AWAITING_VERIFICATION", label: t("timeline.awaiting_verification") },
            { status: OrderStatus.PROCESSING, label: t("timeline.processing") },
            { status: OrderStatus.CONFIRMED, label: t("timeline.confirmed_service") },
            { status: OrderStatus.READY, label: t("timeline.ready_service") },
            { status: OrderStatus.ON_GOING, label: t("timeline.on_going") },
            { status: OrderStatus.COMPLETED, label: t("timeline.completed") },
        ]
        : [
            { status: OrderStatus.AWAITING_PAYMENT, label: t("timeline.awaiting_payment") },
            { status: "AWAITING_VERIFICATION", label: t("timeline.awaiting_verification") },
            { status: OrderStatus.PROCESSING, label: t("timeline.processing") },
            { status: OrderStatus.CONFIRMED, label: t("timeline.confirmed") },
            { status: OrderStatus.READY, label: t("timeline.ready") },
            { status: OrderStatus.COMPLETED, label: t("timeline.completed") },
        ];

    const currentIndex = timelineSteps.findIndex((s) => s.status === effectiveOrderStatus);

    const statusLabels: Record<string, string> = {
        [OrderStatus.AWAITING_PAYMENT]: isAwaitingVerification
            ? t("status.awaiting_verification")
            : t("status.awaiting_payment"),
        [OrderStatus.PROCESSING]: t("status.processing"),
        [OrderStatus.CONFIRMED]: t("status.confirmed_label"),
        [OrderStatus.READY]: hasServiceProduct ? t("status.ready_service_label") : t("status.ready_label"),
        [OrderStatus.ON_GOING]: t("status.on_going_label"),
        [OrderStatus.COMPLETED]: t("status.completed_label"),
        [OrderStatus.CANCELLED]: t("status.cancelled_label"),
    };

    const status = STATUS_MAP[order.orderStatus] ?? STATUS_MAP[OrderStatus.PROCESSING];
    const StatusIcon = status.icon;

    const subtotal = order.totalAmount - order.midtransFee - order.appFee - (order.taxAmount ?? 0);
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
                className="h-[92vh] sm:h-[88vh] p-0 rounded-t-2xl bg-background border-0 focus:outline-none"
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
                </div>

                <ScrollArea className="h-[calc(100%-20px)]">
                    <div className="px-4 sm:px-5 pb-10 space-y-5">

                        <SheetHeader className="pt-2 p-0 pb-0 space-y-0 text-left">
                            {/* Status icon + title row */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className={cn(
                                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                                    status.iconBg,
                                )}>
                                    <StatusIcon className={cn("w-5 h-5", status.iconColor)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <SheetTitle className="text-base sm:text-lg font-bold leading-tight text-foreground">
                                        {t("detail.title")}
                                    </SheetTitle>
                                    <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                                        {order.outlet.name}
                                    </SheetDescription>
                                </div>
                                {/* Status badge */}
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
                                    "text-[10px] sm:text-[11px] font-semibold border shrink-0",
                                    status.badgeBg,
                                    status.textColor,
                                )}>
                                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", status.dotColor)} />
                                    {statusLabels[order.orderStatus] || order.orderStatus}
                                </span>
                            </div>

                            {/* Order ID row */}
                            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border/50">
                                <Receipt className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <code className="text-xs font-mono text-muted-foreground flex-1 truncate">
                                    {order.id}
                                </code>
                                <button
                                    onClick={copyOrderId}
                                    className={cn(
                                        "flex items-center gap-1.5 text-[11px] font-semibold",
                                        "text-muted-foreground hover:text-foreground",
                                        "transition-colors shrink-0 px-2 py-1 rounded-lg",
                                        "hover:bg-background active:scale-95",
                                    )}
                                    aria-label="Salin Order ID"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    Salin
                                </button>
                            </div>
                        </SheetHeader>

                        {isCancelled && order.cancellationReason && (
                            <AlertBanner
                                title="Alasan Pembatalan"
                                message={order.cancellationReason}
                            />
                        )}

                        {order.transaction?.status === "REJECTED_MANUAL" && (
                            <AlertBanner
                                title="Bukti Pembayaran Ditolak"
                                message={order.transaction.rejectionNote || "Tidak ada alasan"}
                            />
                        )}

                        {order.orderStatus === OrderStatus.AWAITING_PAYMENT &&
                            !isAwaitingVerification &&
                            order.transaction?.expiryTime && (
                                <CountdownTimer
                                    expiryTime={order.transaction.expiryTime}
                                    compact={false}
                                />
                            )}

                        {!isCancelled && (
                            <div>
                                <SectionLabel>{t("detail.progress")}</SectionLabel>
                                <TimelineProgress
                                    timelineSteps={timelineSteps}
                                    currentIndex={currentIndex}
                                />
                            </div>
                        )}

                        {hasServiceProduct && queueMeta && (
                            <div>
                                <SectionLabel>Informasi Antrian</SectionLabel>
                                <div className="rounded-xl border border-border/50 bg-muted/20 divide-y divide-border/50">
                                    <div className="flex items-center justify-between px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <ListOrdered className="w-4 h-4 text-muted-foreground shrink-0" />
                                            <span className="text-sm text-muted-foreground">
                                                {t("queue.positionLabel")}
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold text-foreground tabular-nums">
                                            {queueMeta.position ? `#${queueMeta.position}` : t("queue.positionPending")}
                                        </span>
                                    </div>
                                    {scheduleLabel && (
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <span className="text-xs text-muted-foreground">
                                                {queueMeta.totalAhead > 0
                                                    ? t("queue.peopleAhead", { count: queueMeta.totalAhead })
                                                    : t("queue.noOneAhead")}
                                            </span>
                                            <span className="text-xs font-medium text-foreground">
                                                {t("queue.estimatedStart", { date: scheduleLabel })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div>
                            <SectionLabel>{t("detail.orderInfo")}</SectionLabel>
                            <div className="rounded-xl border border-border/50 bg-muted/20 divide-y divide-border/50">
                                <div className="px-4 py-3">
                                    <InfoRow icon={Store} label="Outlet" value={order.outlet.name} />
                                </div>
                                <div className="px-4 py-3">
                                    <InfoRow icon={User} label={t("detail.customerName")} value={order.customerDetails.name} />
                                </div>
                                <div className="px-4 py-3">
                                    <InfoRow icon={Phone} label={t("detail.customerPhone")} value={order.customerDetails.phone} mono />
                                </div>
                            </div>
                        </div>

                        <div>
                            <SectionLabel>{t("detail.itemDetails")}</SectionLabel>
                            <div className="rounded-xl border border-border/50 overflow-hidden">
                                {order.items.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "flex items-center justify-between px-4 py-3 bg-background",
                                            idx !== order.items.length - 1 && "border-b border-border/50",
                                        )}
                                    >
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            {/* Qty pill */}
                                            <span className={cn(
                                                "inline-flex items-center justify-center",
                                                "w-6 h-6 rounded-md shrink-0 mt-0.5",
                                                "bg-muted border border-border/60",
                                                "text-[11px] font-bold text-foreground tabular-nums",
                                            )}>
                                                {item.quantity}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate leading-tight">
                                                    {item.product.name}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                                    {formatCurrency(item.priceAtTimeOfOrder)} / item
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-foreground ml-3 shrink-0 tabular-nums">
                                            {formatCurrency(item.quantity * item.priceAtTimeOfOrder)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {hasTicketProduct && ticketItems.length > 0 && (
                            <div>
                                <SectionLabel>Tiket Anda</SectionLabel>
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
                                <p className="text-[10px] text-muted-foreground text-center mt-2">
                                    Tunjukkan QR code saat datang ke lokasi event
                                </p>
                            </div>
                        )}

                        <div>
                            <SectionLabel>{t("detail.paymentSummary")}</SectionLabel>
                            <div className="rounded-xl border border-border/50 bg-background overflow-hidden">
                                <div className="px-4 py-3 space-y-2.5">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">{t("detail.subtotal")}</span>
                                        <span className="font-medium text-foreground tabular-nums">
                                            {formatCurrency(subtotal)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">{t("detail.serviceFee")}</span>
                                        <span className="font-medium text-foreground tabular-nums">
                                            {formatCurrency(order.appFee)}
                                        </span>
                                    </div>
                                    {order.taxAmount && order.taxAmount > 0 ? (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">{t("detail.tax")}</span>
                                            <span className="font-medium text-foreground tabular-nums">
                                                {formatCurrency(order.taxAmount)}
                                            </span>
                                        </div>
                                    ) : null}
                                    {showTransactionFee && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">{t("detail.transactionFee")}</span>
                                            <span className="font-medium text-foreground tabular-nums">
                                                {formatCurrency(order.midtransFee)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {/* Total row — highlighted */}
                                <div className="flex items-center justify-between px-4 py-3.5 bg-muted/30 border-t border-border/50">
                                    <span className="text-sm font-bold text-foreground">
                                        {t("detail.totalPayment")}
                                    </span>
                                    <span className="text-base sm:text-lg font-extrabold text-primary tabular-nums">
                                        {formatCurrency(order.totalAmount)}
                                    </span>
                                </div>
                            </div>

                            {/* Payment method chip */}
                            <div className="flex items-center gap-2.5 mt-2.5 px-3.5 py-2.5 rounded-xl bg-muted/30 border border-border/50">
                                <Wallet className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground">{t("detail.paymentMethod")}</p>
                                    <p className="text-xs font-semibold text-foreground capitalize truncate">
                                        {order.transaction?.paymentMethod.replace(/_/g, " ") || "Unknown"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2.5 pt-1">
                            {/* Download Ticket */}
                            {hasTicketProduct && order.orderStatus === OrderStatus.COMPLETED && (
                                <Button
                                    variant="default"
                                    className="w-full h-11 sm:h-10 text-sm font-semibold gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.15)]"
                                    onClick={() => onAction?.("download_ticket", order)}
                                    disabled={isBusy}
                                >
                                    {isBusy && pendingAction?.action === "download_ticket" ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                    {t("actions.downloadTicket")}
                                </Button>
                            )}

                            {/* Calendar */}
                            {isCalendarEligible && (
                                <Button
                                    variant="outline"
                                    className="w-full h-11 sm:h-10 text-sm font-semibold gap-2"
                                    onClick={() => onAction?.("calendar", order)}
                                >
                                    <CalendarPlus className="w-4 h-4" />
                                    {t("actions.addToCalendar")}
                                </Button>
                            )}

                            {/* Pay + Cancel */}
                            {order.orderStatus === OrderStatus.AWAITING_PAYMENT && !isAwaitingVerification && (
                                <div className="flex gap-2.5">
                                    <Button
                                        variant="default"
                                        className="flex-1 h-11 sm:h-10 text-sm font-semibold"
                                        onClick={() => onAction?.("pay", order)}
                                        disabled={isBusy}
                                    >
                                        {t("actions.pay")}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-11 sm:h-10 text-sm font-semibold"
                                        onClick={() => onAction?.("cancel", order)}
                                        disabled={isBusy}
                                    >
                                        {isBusy && pendingAction?.action === "cancel" && (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        )}
                                        {t("actions.cancel")}
                                    </Button>
                                </div>
                            )}

                            {/* Contact outlet */}
                            {order.orderStatus !== OrderStatus.CANCELLED &&
                                order.orderStatus !== OrderStatus.COMPLETED &&
                                (order.orderStatus !== OrderStatus.AWAITING_PAYMENT || isAwaitingVerification) && (
                                    <Button
                                        variant="outline"
                                        className="w-full h-11 sm:h-10 text-sm font-semibold gap-2"
                                        onClick={() => onAction?.("contact", order)}
                                        disabled={isBusy}
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        {t("actions.contactOutlet")}
                                    </Button>
                                )}

                            {/* Confirm (goods only) */}
                            {order.orderStatus === OrderStatus.READY && !hasServiceProduct && (
                                <Button
                                    variant="default"
                                    className="w-full h-11 sm:h-10 text-sm font-semibold gap-2"
                                    onClick={() => onAction?.("confirm", order)}
                                    disabled={isBusy}
                                >
                                    {isBusy && pendingAction?.action === "confirm" ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4" />
                                    )}
                                    {t("actions.confirm")}
                                </Button>
                            )}

                            {/* Reorder */}
                            {(order.orderStatus === OrderStatus.COMPLETED ||
                                order.orderStatus === OrderStatus.CANCELLED) && (
                                    <Button
                                        variant="outline"
                                        className="w-full h-11 sm:h-10 text-sm font-semibold gap-2"
                                        onClick={() => onAction?.("reorder", order)}
                                        disabled={isBusy}
                                    >
                                        {isBusy && pendingAction?.action === "reorder" ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-4 h-4" />
                                        )}
                                        {t("actions.reorder")}
                                    </Button>
                                )}

                            {/* Close */}
                            <Button
                                variant="secondary"
                                className="w-full h-11 sm:h-10 text-sm font-semibold"
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