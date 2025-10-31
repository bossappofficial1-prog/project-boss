'use client'

import { OrderDetail } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Clock, CreditCard, CheckCircle, XCircle, Hourglass, PackageCheck, Store, User, Phone } from "lucide-react"
import { useTranslations } from "@/hooks/useI18n"
import { cn, formatCurrency, formatDateTime } from "@/lib/utils"

interface OrderDetailModalProps {
    order: OrderDetail | null
    isOpen: boolean
    onClose: () => void
}

const statusConfig: any = {
    AWAITING_PAYMENT: { label: "Menunggu Pembayaran", icon: <Hourglass className="w-4 h-4" />, color: "text-yellow-600" },
    PROCESSING: { label: "Diproses", icon: <Clock className="w-4 h-4" />, color: "text-blue-600" },
    CONFIRMED: { label: "Dikonfirmasi", icon: <CheckCircle className="w-4 h-4" />, color: "text-cyan-600" },
    READY: { label: "Siap Diambil", icon: <PackageCheck className="w-4 h-4" />, color: "text-green-600" },
    COMPLETED: { label: "Selesai", icon: <CheckCircle className="w-4 h-4" />, color: "text-primary" },
    CANCELLED: { label: "Dibatalkan", icon: <XCircle className="w-4 h-4" />, color: "text-destructive" },
}

export default function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
    const t = useTranslations("orders")

    if (!order) return null

    const currentStatus = statusConfig[order.orderStatus] || statusConfig.PROCESSING

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md sm:rounded-md p-0 max-w-full rounded-none">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="flex items-center gap-2">
                        Detail Pesanan
                    </DialogTitle>
                    <DialogDescription>
                        #{order.id}
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto px-6 pb-6 space-y-4">
                    <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <div className={cn("flex items-center gap-1.5 font-semibold text-sm", currentStatus.color)}>
                                {currentStatus.icon}
                                <span>{currentStatus.label}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Tanggal</span>
                            <span className="text-sm font-medium">{formatDateTime(order.createdAt)}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold">Informasi Outlet</h3>
                        <div className="flex items-center gap-3">
                            <Store className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{order.outlet.name}</span>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="font-semibold">Informasi Pelanggan</h3>
                        <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{order.customerDetails.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{order.customerDetails.phone}</span>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="font-semibold">Rincian Item</h3>
                        <div className="space-y-2">
                            {order.items.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                    <div>
                                        <p className="font-medium">{item.product.name}</p>
                                        <p className="text-xs text-muted-foreground">{item.quantity} x {formatCurrency(item.priceAtTimeOfOrder)}</p>
                                    </div>
                                    <p>{formatCurrency(item.quantity * item.priceAtTimeOfOrder)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <p className="text-muted-foreground">Subtotal</p>
                            <p>{formatCurrency(order.totalAmount - order.midtransFee - order.appFee)}</p>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <p className="text-muted-foreground">Biaya Layanan</p>
                            <p>{formatCurrency(order.appFee)}</p>
                        </div>
                        {/* Hide transaction fee for manual payment methods */}
                        {order.midtransFee > 0 && 
                         order.transaction?.paymentMethod !== 'QRIS_OFFLINE' && 
                         order.transaction?.paymentMethod !== 'OWNER_TRANSFER' && (
                            <div className="flex justify-between items-center text-sm">
                                <p className="text-muted-foreground">Biaya Transaksi</p>
                                <p>{formatCurrency(order.midtransFee)}</p>
                            </div>
                        )}
                        <div className="flex justify-between items-center font-bold text-base pt-2 border-t mt-2">
                            <p>Total Pembayaran</p>
                            <p>{formatCurrency(order.totalAmount)}</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <h3 className="font-semibold">Metode Pembayaran</h3>
                        <div className="flex items-center gap-3">
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm capitalize">{order.transaction?.paymentMethod.replace(/_/g, " ") || "Uknown"}</span>
                        </div>
                    </div>
                </div>
                <DialogFooter className="p-6 pt-0">
                    <Button variant="outline" className="w-full" onClick={onClose}>Tutup</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}



