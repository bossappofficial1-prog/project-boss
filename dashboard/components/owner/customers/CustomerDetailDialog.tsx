"use client";

import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomer } from "@/hooks/useCustomers";

interface CustomerDetailDialogProps {
    customerId: string | null;
    outletId?: string | null;
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

const formatDateTime = (value?: string | Date) => {
    if (!value) return "-";
    try {
        return format(new Date(value), "dd MMM yyyy, HH:mm", { locale: localeId });
    } catch {
        return "-";
    }
};

const getOrderStatusLabel = (status?: string) => {
    if (status === "AWAITING_PAYMENT") return "Menunggu Bayar";
    if (status === "PROCESSING") return "Diproses";
    if (status === "CONFIRMED") return "Dikonfirmasi";
    if (status === "READY") return "Siap Ambil";
    if (status === "ON_GOING") return "Sedang Jalan";
    if (status === "COMPLETED") return "Selesai";
    if (status === "CANCELLED") return "Batal";
    return status || "-";
};

const getOrderStatusVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    if (status === "AWAITING_PAYMENT") return "warning";
    if (status === "CANCELLED") return "destructive";
    if (status === "PROCESSING") return "default";
    if (status === "COMPLETED" || status === "CONFIRMED" || status === "READY" || status === "ON_GOING") return "success";
    return "outline";
};

const getPaymentStatusLabel = (status?: string) => {
    if (status === "SUCCESS") return "Berhasil";
    if (status === "PENDING") return "Tertunda";
    if (status === "PROOF_SUBMITTED") return "Bukti Terkirim";
    if (status === "AWAITING_VERIFICATION") return "Menunggu Verifikasi";
    if (status === "FAILED") return "Gagal";
    if (status === "EXPIRED") return "Kadaluarsa";
    if (status === "REFUNDED") return "Refund";
    if (status === "CANCELLED") return "Dibatalkan";
    if (status === "REJECTED_MANUAL") return "Ditolak Manual";
    return status || "-";
};

const getPaymentStatusVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    if (status === "SUCCESS") return "success";
    if (status === "PENDING" || status === "PROOF_SUBMITTED" || status === "AWAITING_VERIFICATION") return "warning";
    if (status === "FAILED" || status === "EXPIRED" || status === "CANCELLED" || status === "REJECTED_MANUAL") return "destructive";
    if (status === "REFUNDED") return "outline";
    return "outline";
};

export default function CustomerDetailDialog({ customerId, outletId, open, onOpenChange }: CustomerDetailDialogProps) {
    const { data, isLoading, isFetching } = useCustomer(customerId || "", outletId);
    const customer = data as any;

    const orders = Array.isArray(customer?.orders) ? customer.orders : [];
    const totalOrders = orders.length;
    const totalSpending = orders.reduce((acc: number, order: any) => {
        return acc + Number(order?.totalAmount || 0);
    }, 0);
    const lastTransaction = orders[0]?.createdAt;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Detail Pelanggan</DialogTitle>
                    <DialogDescription>Informasi pelanggan dan riwayat order (readonly).</DialogDescription>
                </DialogHeader>

                {(isLoading || isFetching) && (
                    <div className="space-y-3">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                )}

                {!isLoading && !isFetching && customer && (
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-muted-foreground">Nama</p>
                                <p className="font-medium">{customer.name || "-"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">No. HP</p>
                                <p className="font-medium">{customer.phone || "-"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Email</p>
                                <p className="font-medium">{customer.email || "-"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Bergabung</p>
                                <p className="font-medium">{formatDateTime(customer.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Total Pesanan</p>
                                <Badge variant="secondary">{totalOrders} Pesanan</Badge>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Total Belanja</p>
                                <p className="font-semibold">{formatCurrency(totalSpending)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Poin</p>
                                <p className="font-medium">{customer.totalPoint ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Transaksi Terakhir</p>
                                <p className="font-medium">{formatDateTime(lastTransaction)}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-semibold">Riwayat Order</p>
                            {orders.length > 0 ? (
                                <div className="space-y-2">
                                    {orders.slice(0, 10).map((order: any) => (
                                        <div key={order.id} className="rounded-md border p-3 text-sm space-y-1">
                                            <p className="font-medium break-all">Order: {order.id || "-"}</p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant={getOrderStatusVariant(order.orderStatus)}>
                                                    {getOrderStatusLabel(order.orderStatus)}
                                                </Badge>
                                                <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                                                    {getPaymentStatusLabel(order.paymentStatus)}
                                                </Badge>
                                                <span className="text-muted-foreground">{formatDateTime(order.createdAt)}</span>
                                            </div>
                                            <p className="font-semibold">{formatCurrency(Number(order.totalAmount || 0))}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Belum ada riwayat order.</p>
                            )}
                        </div>
                    </div>
                )}

                {!isLoading && !isFetching && !customer && (
                    <p className="text-sm text-muted-foreground">Detail pelanggan tidak tersedia.</p>
                )}
            </DialogContent>
        </Dialog>
    );
}
