"use client"

import { OrderDetail, OrderStatus } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn, formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Store, Phone, RefreshCw, CheckCircle2, XCircle, Clock, Hourglass, PackageCheck, ChevronRight, Play } from "lucide-react"
import { useTranslations } from "@/hooks/useI18n"
import dynamic from "next/dynamic"

const CountdownTimer = dynamic(() => import("./CountdownTimer"), { ssr: false })

interface EnhancedOrderCardProps {
    order: OrderDetail
    onClick: () => void
    onQuickAction?: (action: 'contact' | 'cancel' | 'reorder' | 'confirm' | 'pay', order: OrderDetail) => void
}

export default function EnhancedOrderCard({ order, onClick, onQuickAction }: EnhancedOrderCardProps) {
    const t = useTranslations('orders')

    const statusConfig = {
        [OrderStatus.AWAITING_PAYMENT]: {
            label: t('status.awaiting_payment'),
            icon: Hourglass,
            color: "bg-yellow-500",
            textColor: "text-yellow-700 dark:text-yellow-400",
            bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
            progress: 10,
        },
        [OrderStatus.PROCESSING]: {
            label: t('status.processing'),
            icon: Clock,
            color: "bg-blue-500",
            textColor: "text-blue-700 dark:text-blue-400",
            bgColor: "bg-blue-50 dark:bg-blue-950/20",
            progress: 25,
        },
        [OrderStatus.CONFIRMED]: {
            label: t('status.confirmed_label'),
            icon: CheckCircle2,
            color: "bg-cyan-500",
            textColor: "text-cyan-700 dark:text-cyan-400",
            bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
            progress: 50,
        },
        [OrderStatus.READY]: {
            label: t('status.ready_label'),
            icon: PackageCheck,
            color: "bg-green-500",
            textColor: "text-green-700 dark:text-green-400",
            bgColor: "bg-green-50 dark:bg-green-950/20",
            progress: 75,
        },
        [OrderStatus.ON_GOING]: {
            label: t('status.on_going_label'),
            icon: Play,
            color: "bg-orange-500",
            textColor: "text-orange-700 dark:text-orange-400",
            bgColor: "bg-orange-50 dark:bg-orange-950/20",
            progress: 80,
        },
        [OrderStatus.COMPLETED]: {
            label: t('status.completed_label'),
            icon: CheckCircle2,
            color: "bg-primary",
            textColor: "text-primary",
            bgColor: "bg-primary/5",
            progress: 100,
        },
        [OrderStatus.CANCELLED]: {
            label: t('status.cancelled_label'),
            icon: XCircle,
            color: "bg-destructive",
            textColor: "text-destructive",
            bgColor: "bg-destructive/5",
            progress: 0,
        },
    }

    const currentStatus = statusConfig[order.orderStatus] || statusConfig[OrderStatus.PROCESSING]
    const StatusIcon = currentStatus.icon

    const formattedDate = format(new Date(order.createdAt), "d MMM yyyy", { locale: id })
    const formattedTime = format(new Date(order.createdAt), "HH:mm", { locale: id })
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)

    const getQuickActions = () => {
        switch (order.orderStatus) {
            case OrderStatus.AWAITING_PAYMENT:
                return [
                    { label: t('actions.pay'), icon: null, action: 'pay' as const, variant: "default" as const },
                    { label: t('actions.cancel'), icon: null, action: 'cancel' as const, variant: "outline" as const },
                ]
            case OrderStatus.PROCESSING:
            case OrderStatus.CONFIRMED:
                return [
                    { label: t('actions.contact'), icon: Phone, action: 'contact' as const, variant: "outline" as const },
                ]
            case OrderStatus.READY:
                return [
                    { label: t('actions.contact'), icon: Phone, action: 'contact' as const, variant: "outline" as const },
                    { label: t('actions.confirm'), icon: CheckCircle2, action: 'confirm' as const, variant: "default" as const },
                ]
            case OrderStatus.ON_GOING:
                return [
                    { label: t('actions.contact'), icon: Phone, action: 'contact' as const, variant: "outline" as const },
                ]
            case OrderStatus.COMPLETED:
                return [
                    { label: t('actions.reorder'), icon: RefreshCw, action: 'reorder' as const, variant: "outline" as const },
                ]
            case OrderStatus.CANCELLED:
                return [
                    { label: t('actions.reorder'), icon: RefreshCw, action: 'reorder' as const, variant: "outline" as const },
                ]
            default:
                return []
        }
    }

    const quickActions = getQuickActions()

    return (
        <Card className="overflow-hidden shadow-none transition-all p-0 rounded-md" style={{ borderLeftColor: currentStatus.color.replace('bg-', '#') }}>
            <CardContent className="p-0">
                {/* Status Header */}
                <div className={cn("px-4 py-2 flex items-center justify-between", currentStatus.bgColor)}>
                    <div className="flex items-center gap-2">
                        <StatusIcon className={cn("w-4 h-4", currentStatus.textColor)} />
                        <span className={cn("text-xs font-semibold", currentStatus.textColor)}>
                            {currentStatus.label}
                        </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {formattedDate} • {formattedTime}
                    </div>
                </div>

                {/* Main Content - Clickable */}
                <div onClick={onClick} className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="px-4 py-3 space-y-3">
                        {/* Outlet Info */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="bg-muted rounded-md p-2 shrink-0">
                                    <Store className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{order.outlet.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {totalItems} item{totalItems > 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 ml-2" />
                        </div>

                        {/* Countdown Timer for AWAITING_PAYMENT */}
                        {order.orderStatus === OrderStatus.AWAITING_PAYMENT && order.transaction?.expiryTime && (
                            <div className="pt-2 border-t">
                                <CountdownTimer
                                    expiryTime={order.transaction.expiryTime}
                                    compact={true}
                                />
                            </div>
                        )}

                        {/* Progress Bar - Only show if not completed or cancelled */}
                        {order.orderStatus !== OrderStatus.COMPLETED && order.orderStatus !== OrderStatus.CANCELLED && (
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Progress</span>
                                    <span className={cn("font-semibold", currentStatus.textColor)}>
                                        {currentStatus.progress}%
                                    </span>
                                </div>
                                <Progress
                                    value={currentStatus.progress}
                                    className="h-1.5"
                                />
                            </div>
                        )}

                        {/* Price and ID */}
                        <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-muted-foreground">
                                {t('card.orderId')}: #{order.id.slice(0, 8)}
                            </span>
                            <p className="font-bold text-base text-primary">
                                {formatCurrency(order.totalAmount)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                {quickActions.length > 0 && (
                    <div className="px-4 pb-3 flex gap-2">
                        {quickActions.map((action, idx) => {
                            const ActionIcon = action.icon
                            return (
                                <Button
                                    key={idx}
                                    size="sm"
                                    variant={action.variant}
                                    className="flex-1 h-9"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onQuickAction?.(action.action, order)
                                    }}
                                >
                                    {ActionIcon && <ActionIcon className="w-4 h-4 mr-1.5" />}
                                    {action.label}
                                </Button>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
