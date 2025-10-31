"use client"

import { OrderDetail, OrderStatus } from "@/types"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency, formatDateTime } from "@/lib/utils"
import {
    Clock, CreditCard, CheckCircle, XCircle, Hourglass, PackageCheck,
    Store, User, Phone, Copy, RefreshCw, MessageCircle, Play
} from "lucide-react"
import { useSnackbar } from "@/hooks/useSnackbar"
import { useTranslations } from "@/hooks/useI18n"
interface OrderBottomSheetProps {
    order: OrderDetail | null
    isOpen: boolean
    onClose: () => void
    onAction?: (action: 'contact' | 'cancel' | 'reorder' | 'confirm', order: OrderDetail) => void
}

export default function OrderBottomSheet({ order, isOpen, onClose, onAction }: OrderBottomSheetProps) {
    const snackbar = useSnackbar()
    const t = useTranslations('orders')

    const statusConfig: any = {
        AWAITING_PAYMENT: {
            label: t('status.awaiting_payment'),
            icon: Hourglass,
            color: "text-yellow-600 dark:text-yellow-400",
            bgColor: "bg-yellow-50 dark:bg-yellow-950/20"
        },
        PROCESSING: {
            label: t('status.processing'),
            icon: Clock,
            color: "text-blue-600 dark:text-blue-400",
            bgColor: "bg-blue-50 dark:bg-blue-950/20"
        },
        CONFIRMED: {
            label: t('status.confirmed_label'),
            icon: CheckCircle,
            color: "text-cyan-600 dark:text-cyan-400",
            bgColor: "bg-cyan-50 dark:bg-cyan-950/20"
        },
        READY: {
            label: t('status.ready_label'),
            icon: PackageCheck,
            color: "text-green-600 dark:text-green-400",
            bgColor: "bg-green-50 dark:bg-green-950/20"
        },
        ON_GOING: {
            label: t('status.on_going_label'),
            icon: Play,
            color: "text-orange-600 dark:text-orange-400",
            bgColor: "bg-orange-50 dark:bg-orange-950/20"
        },
        COMPLETED: {
            label: t('status.completed_label'),
            icon: CheckCircle,
            color: "text-primary",
            bgColor: "bg-primary/5"
        },
        CANCELLED: {
            label: t('status.cancelled_label'),
            icon: XCircle,
            color: "text-destructive",
            bgColor: "bg-destructive/5"
        },
    }

    // Check if order contains any service products
    const hasServiceProduct = order?.items.some(item => item.product.type === "SERVICE") ?? false

    // Timeline for GOODS
    const goodsTimelineSteps = [
        { status: OrderStatus.AWAITING_PAYMENT, label: t('timeline.awaiting_payment') },
        { status: OrderStatus.PROCESSING, label: t('timeline.processing') },
        { status: OrderStatus.CONFIRMED, label: t('timeline.confirmed') },
        { status: OrderStatus.READY, label: t('timeline.ready') },
        { status: OrderStatus.COMPLETED, label: t('timeline.completed') },
    ]

    // Timeline for SERVICE
    const serviceTimelineSteps = [
        { status: OrderStatus.AWAITING_PAYMENT, label: t('timeline.awaiting_payment') },
        { status: OrderStatus.PROCESSING, label: t('timeline.processing') },
        { status: OrderStatus.CONFIRMED, label: t('timeline.confirmed') },
        { status: OrderStatus.READY, label: t('timeline.ready') },
        { status: OrderStatus.ON_GOING, label: t('timeline.on_going') },
        { status: OrderStatus.COMPLETED, label: t('timeline.completed') },
    ]

    // Use appropriate timeline based on product type
    const timelineSteps = hasServiceProduct ? serviceTimelineSteps : goodsTimelineSteps

    if (!order) return null

    const currentStatus = statusConfig[order.orderStatus] || statusConfig.PROCESSING
    const CurrentStatusIcon = currentStatus.icon

    const copyOrderId = () => {
        navigator.clipboard.writeText(order.id)
        snackbar.success(t('messages.orderIdCopied'))
    }

    const getStatusIndex = (status: string) => {
        return timelineSteps.findIndex(step => step.status === status)
    }

    const currentIndex = getStatusIndex(order.orderStatus)
    const isCancelled = order.orderStatus === OrderStatus.CANCELLED

    return (
        <Sheet open={isOpen} onOpenChange={onClose} >
            <SheetContent side="bottom" className="h-[90vh] z-[101] p-0 rounded-t-xl">
                <ScrollArea className="h-full">
                    <SheetHeader className="p-6 pb-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-xl">{t('detail.title')}</SheetTitle>
                            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full", currentStatus.bgColor)}>
                                <CurrentStatusIcon className={cn("w-4 h-4", currentStatus.color)} />
                                <span className={cn("text-sm font-semibold", currentStatus.color)}>
                                    {currentStatus.label}
                                </span>
                            </div>
                        </div>
                        <SheetDescription className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{t('detail.orderId')}:</span>
                            <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                {order.id.slice(0, 12)}...
                            </code>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={copyOrderId}>
                                <Copy className="w-3 h-3" />
                            </Button>
                        </SheetDescription>
                    </SheetHeader>

                    <div className="px-6 pb-6 space-y-6">
                        {/* Timeline - Only show if not cancelled */}
                        {!isCancelled && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-sm">{t('detail.progress')}</h3>
                                <div className="relative space-y-4">
                                    {timelineSteps.map((step, index) => {
                                        const StepIcon = statusConfig[step.status]?.icon || Clock
                                        const isCompleted = index <= currentIndex
                                        const isCurrent = index === currentIndex

                                        return (
                                            <div key={step.status} className="flex items-start gap-3 relative">
                                                {/* Connector Line */}
                                                {index < timelineSteps.length - 1 && (
                                                    <div className={cn(
                                                        "absolute left-[15px] top-8 w-0.5 h-6",
                                                        isCompleted ? "bg-primary" : "bg-border"
                                                    )} />
                                                )}

                                                {/* Icon */}
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-4 ring-background z-10",
                                                    isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                                                    isCurrent && "ring-primary/20"
                                                )}>
                                                    {isCompleted ? (
                                                        <CheckCircle className="w-4 h-4" />
                                                    ) : (
                                                        <StepIcon className="w-4 h-4" />
                                                    )}
                                                </div>

                                                {/* Label */}
                                                <div className="flex-1 pt-1">
                                                    <p className={cn(
                                                        "text-sm font-medium",
                                                        isCurrent ? "text-foreground" : "text-muted-foreground"
                                                    )}>
                                                        {step.label}
                                                    </p>
                                                    {isCurrent && (
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {formatDateTime(order.updatedAt)}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Badge for current */}
                                                {isCurrent && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {t('detail.currentStatus')}
                                                    </Badge>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        <Separator />

                        {/* Outlet Info */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm">{t('detail.outletInfo')}</h3>
                            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                                <Store className="w-5 h-5 text-muted-foreground" />
                                <span className="text-sm font-medium">{order.outlet.name}</span>
                            </div>
                        </div>

                        <Separator />

                        {/* Customer Info */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm">{t('detail.customerInfo')}</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">{order.customerDetails.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">{order.customerDetails.phone}</span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Items */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm">{t('detail.itemDetails')}</h3>
                            <div className="space-y-2">
                                {order.items.map(item => (
                                    <div key={item.id} className="flex justify-between items-start text-sm p-3 rounded-md bg-muted/30">
                                        <div className="flex-1">
                                            <p className="font-medium">{item.product.name}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {item.quantity} x {formatCurrency(item.priceAtTimeOfOrder)}
                                            </p>
                                        </div>
                                        <p className="font-semibold">
                                            {formatCurrency(item.quantity * item.priceAtTimeOfOrder)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* Payment Summary */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm">{t('detail.paymentSummary')}</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('detail.subtotal')}</span>
                                    <span>{formatCurrency(order.totalAmount - order.midtransFee - order.appFee)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('detail.serviceFee')}</span>
                                    <span>{formatCurrency(order.appFee)}</span>
                                </div>
                                {/* Hide transaction fee for manual payment methods */}
                                {order.midtransFee > 0 && 
                                 order.transaction?.paymentMethod !== 'QRIS_OFFLINE' && 
                                 order.transaction?.paymentMethod !== 'OWNER_TRANSFER' && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('detail.transactionFee')}</span>
                                        <span>{formatCurrency(order.midtransFee)}</span>
                                    </div>
                                )}
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-base pt-1">
                                    <span>{t('detail.totalPayment')}</span>
                                    <span className="text-primary">{formatCurrency(order.totalAmount)}</span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Payment Method */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm">{t('detail.paymentMethod')}</h3>
                            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                                <CreditCard className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm capitalize">
                                    {order.transaction?.paymentMethod.replace(/_/g, " ") || "Unknown"}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-4">
                            {order.orderStatus !== OrderStatus.CANCELLED && order.orderStatus !== OrderStatus.COMPLETED && (
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => onAction?.('contact', order)}
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    {t('actions.contactOutlet')}
                                </Button>
                            )}
                            {order.orderStatus === OrderStatus.COMPLETED && (
                                <Button
                                    variant="outline"
                                    className="w-full col-span-2"
                                    onClick={() => onAction?.('reorder', order)}
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    {t('actions.reorder')}
                                </Button>
                            )}
                            <Button
                                variant="default"
                                className="w-full col-span-2"
                                onClick={onClose}
                            >
                                {t('actions.close')}
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
