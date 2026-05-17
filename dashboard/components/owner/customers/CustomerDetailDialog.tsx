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
import { cn } from "@/lib/utils";

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
            <DialogContent className="max-w-2xl gap-0 p-0 min-w-3xl border-border/80 shadow-2xl overflow-hidden">
                <DialogHeader className="p-6 border-b border-border/40 bg-muted/30">
                    <DialogTitle className="text-sm font-bold text-foreground/90">Detail Pelanggan</DialogTitle>
                    <DialogDescription className="text-[10px] font-medium uppercase tracking-tighter opacity-70">Informasi pelanggan dan riwayat transaksi mendetail.</DialogDescription>
                </DialogHeader>

                {(isLoading || isFetching) && (
                    <div className="p-6 space-y-6 animate-pulse">
                        <div className="grid grid-cols-2 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-3 w-20 bg-muted/20" />
                                    <Skeleton className="h-5 w-full bg-muted/30" />
                                </div>
                            ))}
                        </div>
                        <div className="space-y-4 pt-4 border-t border-border/40">
                            <Skeleton className="h-4 w-32 bg-muted/20" />
                            <div className="space-y-2">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-20 w-full bg-muted/10 rounded-md" />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {!isLoading && !isFetching && customer && (
                    <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground opacity-70">Nama Lengkap</p>
                                <p className="text-sm font-bold text-foreground/90">{customer.name || "-"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground opacity-70">No. HP / WA</p>
                                <p className="text-sm font-bold text-foreground/90 tabular-nums">{customer.phone || "-"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground opacity-70">Email Address</p>
                                <p className="text-sm font-medium text-foreground/80 italic">{customer.email || "-"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground opacity-70">Tanggal Bergabung</p>
                                <p className="text-sm font-bold text-foreground/90 tabular-nums">{formatDateTime(customer.createdAt)}</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-muted-foreground opacity-70">Total Pesanan</p>
                                <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-wider px-2 py-0 border-primary/20 bg-primary/5 text-primary shadow-none">
                                    {totalOrders} Pesanan
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground opacity-70">Total Belanja</p>
                                <p className="text-sm font-bold text-emerald-600 tabular-nums">{formatCurrency(totalSpending)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground opacity-70">Loyalty Poin</p>
                                <p className="text-sm font-bold text-violet-600 tabular-nums">{customer.totalPoint ?? 0} Poin</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground opacity-70">Transaksi Terakhir</p>
                                <p className="text-sm font-bold text-foreground/90 tabular-nums">{formatDateTime(lastTransaction)}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-border/40">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-bold text-muted-foreground">Riwayat Order (10 Terakhir)</h4>
                                <Badge variant="outline" className="text-[9px] font-bold border-border/60 text-muted-foreground/60">{orders.length} Total</Badge>
                            </div>

                            {orders.length > 0 ? (
                                <div className="space-y-3">
                                    {orders.slice(0, 10).map((order: any) => (
                                        <div key={order.id} className="group rounded-md border border-border/60 bg-muted/5 p-4 transition-all hover:bg-muted/10 hover:border-border/80">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-muted-foreground opacity-60">Order ID</p>
                                                    <p className="text-xs font-bold text-foreground/90 break-all tabular-nums">#{order.id?.slice(-8).toUpperCase() || "-"}</p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0 shadow-none border-opacity-20",
                                                        getOrderStatusVariant(order.orderStatus) === "success" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500" :
                                                            getOrderStatusVariant(order.orderStatus) === "warning" ? "bg-amber-500/10 text-amber-600 border-amber-500" :
                                                                getOrderStatusVariant(order.orderStatus) === "destructive" ? "bg-rose-500/10 text-rose-600 border-rose-500" :
                                                                    "bg-muted text-muted-foreground border-border"
                                                    )}>
                                                        {getOrderStatusLabel(order.orderStatus)}
                                                    </Badge>
                                                    <Badge variant="outline" className={cn(
                                                        "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0 shadow-none border-opacity-20",
                                                        getPaymentStatusVariant(order.paymentStatus) === "success" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500" :
                                                            getPaymentStatusVariant(order.paymentStatus) === "warning" ? "bg-amber-500/10 text-amber-600 border-amber-500" :
                                                                getPaymentStatusVariant(order.paymentStatus) === "destructive" ? "bg-rose-500/10 text-rose-600 border-rose-500" :
                                                                    "bg-muted text-muted-foreground border-border"
                                                    )}>
                                                        {getPaymentStatusLabel(order.paymentStatus)}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-border/40">
                                                <span className="text-[10px] font-medium text-muted-foreground tabular-nums">{formatDateTime(order.createdAt)}</span>
                                                <p className="text-sm font-bold text-foreground/90 tabular-nums">{formatCurrency(Number(order.totalAmount || 0))}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 rounded-md border border-dashed border-border/60 flex flex-col items-center justify-center text-center">
                                    <p className="text-xs font-bold text-muted-foreground/40">Belum Ada Riwayat Order</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!isLoading && !isFetching && !customer && (
                    <div className="p-12 text-center">
                        <p className="text-sm font-bold text-muted-foreground/60">Detail Pelanggan Tidak Tersedia</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
