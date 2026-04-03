"use client";

import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useOrder } from "@/hooks/useOrdersReactQuery";

interface OrderDetailDialogProps {
    orderId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value || 0);
};

const orderStatusLabelMap: Record<string, string> = {
    AWAITING_PAYMENT: "Menunggu Bayar",
    PROCESSING: "Diproses",
    CONFIRMED: "Dikonfirmasi",
    READY: "Siap Ambil",
    ON_GOING: "Sedang Jalan",
    COMPLETED: "Selesai",
    CANCELLED: "Batal",
};

const paymentStatusLabelMap: Record<string, string> = {
    PENDING: "Tertunda",
    PROOF_SUBMITTED: "Bukti Terkirim",
    AWAITING_VERIFICATION: "Menunggu Verifikasi",
    SUCCESS: "Berhasil",
    FAILED: "Gagal",
    REFUNDED: "Refund",
    EXPIRED: "Kadaluarsa",
    CANCELLED: "Dibatalkan",
    REJECTED_MANUAL: "Ditolak Manual",
};

const getOrderStatusVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    if (status === "AWAITING_PAYMENT") return "secondary";
    if (status === "CANCELLED") return "destructive";
    if (status === "PROCESSING") return "default";
    if (status === "COMPLETED" || status === "CONFIRMED" || status === "READY" || status === "ON_GOING") return "success";
    return "outline";
};

const getPaymentStatusVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    if (status === "SUCCESS") return "success";
    if (status === "PENDING" || status === "PROOF_SUBMITTED" || status === "AWAITING_VERIFICATION") return "warning";
    if (status === "FAILED" || status === "EXPIRED" || status === "CANCELLED" || status === "REJECTED_MANUAL") return "destructive";
    if (status === "REFUNDED") return "outline";
    return "outline";
};

export default function OrderDetailDialog({ orderId, open, onOpenChange }: OrderDetailDialogProps) {
    const { data, isLoading, isFetching } = useOrder(orderId || "");
    const order = data as any;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Detail Pesanan</DialogTitle>
                    <DialogDescription>Informasi lengkap pesanan (readonly untuk owner).</DialogDescription>
                </DialogHeader>

                {(isLoading || isFetching) && (
                    <div className="space-y-3">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-28 w-full" />
                    </div>
                )}

                {!isLoading && !isFetching && order && (
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-muted-foreground">No. Pesanan</p>
                                <p className="font-medium break-all">{order.id}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Waktu Transaksi</p>
                                <p className="font-medium">
                                    {order.createdAt
                                        ? format(new Date(order.createdAt), "dd MMM yyyy, HH:mm", { locale: localeId })
                                        : "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Pelanggan</p>
                                <p className="font-medium">{order.guestCustomer?.name || "-"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">No. HP</p>
                                <p className="font-medium">{order.guestCustomer?.phone || "-"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Status Order</p>
                                <Badge variant={getOrderStatusVariant(order.orderStatus)}>
                                    {orderStatusLabelMap[order.orderStatus] || order.orderStatus || "-"}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Status Pembayaran</p>
                                <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                                    {paymentStatusLabelMap[order.paymentStatus] || order.paymentStatus || "-"}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Metode Pembayaran</p>
                                <p className="font-medium uppercase">{order.transaction?.paymentMethod || "-"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Total</p>
                                <p className="font-bold">{formatCurrency(order.totalAmount || 0)}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-semibold">Item Pesanan</p>
                            {Array.isArray(order.items) && order.items.length > 0 ? (
                                <div className="space-y-2">
                                    {order.items.map((item: any) => {
                                        const unitPrice = Number(item.priceAtTimeOfOrder || 0);
                                        const qty = Number(item.quantity || 0);
                                        return (
                                            <div key={item.id} className="rounded-md border p-3 text-sm space-y-1">
                                                <p className="font-medium">{item.product?.name || "Produk"}</p>
                                                <p className="text-muted-foreground">
                                                    {qty} x {formatCurrency(unitPrice)}
                                                </p>
                                                <p className="font-semibold">Subtotal: {formatCurrency(unitPrice * qty)}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Tidak ada item.</p>
                            )}
                        </div>
                    </div>
                )}

                {!isLoading && !isFetching && !order && (
                    <p className="text-sm text-muted-foreground">Detail pesanan tidak tersedia.</p>
                )}
            </DialogContent>
        </Dialog>
    );
}
