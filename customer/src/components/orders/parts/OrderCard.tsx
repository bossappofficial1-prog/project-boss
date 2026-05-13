'use client'

import { OrderDetail, OrderStatus, OrderStatusType } from "@/types"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, formatCurrency } from "@/lib/utils"
import { useTranslations } from "@/hooks/useI18n"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Clock, Hash, Store, CheckCircle, XCircle, Hourglass, Truck, PackageCheck } from "lucide-react"
import { JSX } from "react"

interface OrderCardProps {
    order: OrderDetail
    onClick: () => void
}

const statusConfig: Partial<Record<OrderStatusType, { label: string; icon: JSX.Element; color: string }>> = {
    [OrderStatus.AWAITING_PAYMENT]: {
        label: "Menunggu Pembayaran",
        icon: <Hourglass className="w-3 h-3" />,
        color: "bg-yellow-500",
    },
    [OrderStatus.PROCESSING]: {
        label: "Diproses",
        icon: <Clock className="w-3 h-3" />,
        color: "bg-blue-500",
    },
    [OrderStatus.CONFIRMED]: {
        label: "Dikonfirmasi",
        icon: <CheckCircle className="w-3 h-3" />,
        color: "bg-cyan-500",
    },
    [OrderStatus.READY]: {
        label: "Siap Diambil",
        icon: <PackageCheck className="w-3 h-3" />,
        color: "bg-green-500",
    },
    [OrderStatus.COMPLETED]: {
        label: "Selesai",
        icon: <CheckCircle className="w-3 h-3" />,
        color: "bg-primary",
    },
    [OrderStatus.CANCELLED]: {
        label: "Dibatalkan",
        icon: <XCircle className="w-3 h-3" />,
        color: "bg-destructive",
    },
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
    const currentStatus = statusConfig[order.orderStatus] ?? statusConfig[OrderStatus.PROCESSING]!

    const formattedDate = format(new Date(order.createdAt), "d MMMM yyyy, HH:mm", { locale: id })
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)

    return (
        <Card className="overflow-hidden cursor-pointer p-0 hover:bg-accent/50 transition-colors" onClick={onClick}>
            <CardHeader className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", currentStatus.color)} />
                        <span className="text-xs font-semibold">{currentStatus.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formattedDate}</span>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                    <div className="bg-muted rounded-md p-2">
                        <Store className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm truncate">{order.outlet.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {totalItems} {totalItems > 1 ? "item" : "item"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                    <div className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        <span>{order.id}</span>
                    </div>
                    <p className="font-bold text-sm text-foreground">
                        {formatCurrency(order.totalAmount)}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
