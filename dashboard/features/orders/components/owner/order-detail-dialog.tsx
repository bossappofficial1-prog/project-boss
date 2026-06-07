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
import { useOrder } from "@/hooks/use-orders-react-query";
import { Copy, Mail, Loader2, Check, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/apis/base";

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
                                <p className="text-muted-foreground">Subtotal</p>
                                <p className="font-medium">{formatCurrency((order.totalAmount || 0) - (order.taxAmount ?? 0))}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">{order.items?.find((it: any) => it.product?.taxName)?.product?.taxName || "Pajak"}</p>
                                <p className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(order.taxAmount ?? 0)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Total</p>
                                <p className="font-bold">{formatCurrency(order.totalAmount || 0)}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-semibold">Item Pesanan</p>
                            {Array.isArray(order.items) && order.items.length > 0 ? (
                                <div className="space-y-3">
                                    {order.items.map((item: any) => {
                                        const unitPrice = Number(item.priceAtTimeOfOrder || 0);
                                        const qty = Number(item.quantity || 0);
                                        const isTicket = item.product?.type === "TICKET";
                                        return (
                                            <div key={item.id} className="rounded-xl border p-4 text-sm space-y-3 bg-muted/5">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold text-foreground">{item.product?.name || "Produk"}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {qty} x {formatCurrency(unitPrice)}
                                                        </p>
                                                    </div>
                                                    <p className="font-semibold text-foreground">{formatCurrency(unitPrice * qty)}</p>
                                                </div>

                                                {isTicket && Array.isArray(item.ticketCodes) && item.ticketCodes.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-dashed border-border/80 space-y-2.5">
                                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Daftar E-Tiket ({item.ticketCodes.length})</p>
                                                        <div className="grid gap-2">
                                                            {item.ticketCodes.map((ticket: any) => (
                                                                <TicketCodeRow key={ticket.id} ticket={ticket} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
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

function TicketCodeRow({ ticket }: { ticket: any }) {
    const [isCopying, setIsCopying] = useState(false);
    const [isEmailSending, setIsEmailSending] = useState(false);
    const [isWhatsAppLoading, setIsWhatsAppLoading] = useState(false);

    const handleCopy = async () => {
        setIsCopying(true);
        try {
            const { data: res } = await apiClient.get(`/tickets/share-info/${ticket.code}`);
            if (res?.success && res?.data?.ticketUrl) {
                await navigator.clipboard.writeText(res.data.ticketUrl);
                toast.success("Link tiket berhasil disalin ke clipboard!");
            } else {
                await navigator.clipboard.writeText(`${window.location.origin}/ticket/verify/${ticket.code}`);
                toast.success("Link tiket berhasil disalin!");
            }
        } catch (error) {
            await navigator.clipboard.writeText(`${window.location.origin}/ticket/verify/${ticket.code}`);
            toast.success("Link tiket berhasil disalin!");
        } finally {
            setTimeout(() => setIsCopying(false), 1500);
        }
    };

    const handleWhatsAppShare = async () => {
        setIsWhatsAppLoading(true);
        try {
            const { data: res } = await apiClient.get(`/tickets/share-info/${ticket.code}`);
            if (res?.success && res?.data?.whatsappUrl) {
                window.open(res.data.whatsappUrl, "_blank");
            } else {
                const text = `Halo, berikut link e-tiket Anda: ${window.location.origin}/ticket/verify/${ticket.code}`;
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
            }
        } catch (error) {
            const text = `Halo, berikut link e-tiket Anda: ${window.location.origin}/ticket/verify/${ticket.code}`;
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
        } finally {
            setIsWhatsAppLoading(false);
        }
    };

    const handleEmailResend = async () => {
        setIsEmailSending(true);
        try {
            const { data: res } = await apiClient.post(`/tickets/resend-email/${ticket.code}`);
            if (res?.success) {
                toast.success(res.message || "E-tiket berhasil dikirim ulang ke email pelanggan!");
            } else {
                toast.error("Gagal mengirim ulang e-tiket.");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Gagal mengirim ulang e-tiket via email.");
        } finally {
            setIsEmailSending(false);
        }
    };

    const getTicketStatusColor = (status: string) => {
        if (status === "VALID") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
        if (status === "REDEEMED") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
        return "bg-rose-500/10 text-rose-600 border-rose-500/20";
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/20 font-sans shadow-xs transition-all hover:bg-muted/40">
            <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-foreground bg-muted px-2.5 py-1 rounded border border-border/80 tracking-wide select-all">{ticket.code}</span>
                <Badge className={`text-[9px] font-bold uppercase tracking-wider rounded-full border px-2.5 py-0.5 shadow-none ${getTicketStatusColor(ticket.status)}`}>
                    {ticket.status === "VALID" ? "Valid" : ticket.status === "REDEEMED" ? "Terpakai" : "Batal"}
                </Badge>
            </div>
            
            <div className="flex items-center gap-2">
                <button
                    onClick={handleCopy}
                    disabled={isCopying}
                    title="Salin Link Tiket"
                    className="h-8 w-8 rounded-lg bg-background hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200"
                >
                    {isCopying ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>

                <button
                    onClick={handleWhatsAppShare}
                    disabled={isWhatsAppLoading}
                    title="Kirim ke WhatsApp"
                    className="h-8 w-8 rounded-lg bg-background hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200"
                >
                    {isWhatsAppLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
                </button>

                <button
                    onClick={handleEmailResend}
                    disabled={isEmailSending}
                    title="Kirim Ulang Email"
                    className="h-8 w-8 rounded-lg bg-background hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200"
                >
                    {isEmailSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                </button>
            </div>
        </div>
    );
}
