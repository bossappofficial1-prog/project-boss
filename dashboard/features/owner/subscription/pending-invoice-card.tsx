"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { OwnerSubscriptionInvoice } from "@/lib/apis/owner-subscription";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES } from "./helper";
import { formatDateTime } from "@/lib/withdrawals";
import { AlertCircle, ArrowRight, CreditCard, ExternalLink, ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    pendingInvoice: OwnerSubscriptionInvoice;
    onCancel?: (invoiceId: string) => void;
    isCancelling?: boolean;
}

export function PendingInvoiceCard({ pendingInvoice, onCancel, isCancelling }: Props) {
    return (
        <Card className="gap-0 py-0 rounded-md overflow-hidden border-amber-500/20 bg-amber-500/5 shadow-sm border">
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-amber-500/20 p-6 bg-amber-500/10">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-md bg-background text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-sm">
                        <ReceiptText className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Invoice Menunggu Pembayaran</p>
                        <CardTitle className="text-xl font-black tracking-tight">{pendingInvoice.invoiceNumber}</CardTitle>
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            Diterbitkan: {formatDateTime(pendingInvoice.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="text-left lg:text-right px-4 py-2 rounded-md bg-background/50 border border-amber-500/20 shadow-sm">
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Total Tagihan</p>
                    <p className="text-2xl font-black tracking-tighter text-amber-600 dark:text-amber-400">{formatCurrency(pendingInvoice.amount)}</p>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                    <Badge className={cn('px-2.5 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-widest shadow-none', PAYMENT_STATUS_STYLES[pendingInvoice.status])}>
                        {PAYMENT_STATUS_LABELS[pendingInvoice.status]}
                    </Badge>
                    <div className="h-4 w-px bg-amber-500/20" />
                    <Badge variant="outline" className="px-2.5 py-0.5 rounded-md border-amber-500/30 text-amber-600 dark:text-amber-400 bg-background text-[10px] font-bold uppercase tracking-tight shadow-none">
                        Paket {pendingInvoice.plan?.name ?? '-'}
                    </Badge>
                </div>

                <div className="p-4 rounded-md bg-background border border-amber-500/20 text-sm text-amber-700 dark:text-amber-200 leading-relaxed font-medium italic">
                    "Selesaikan pembayaran segera untuk mengaktifkan fitur penuh dan memperpanjang masa aktif operasional bisnis Anda hingga {pendingInvoice.plan?.durationDays ?? '-'} hari ke depan."
                </div>

                {pendingInvoice.status === 'REJECTED_MANUAL' && pendingInvoice.rejectionReason && (
                    <div className="flex items-start gap-3 rounded-md border border-rose-200 bg-rose-500/10 p-4 text-xs text-rose-700 dark:text-rose-400 shadow-sm">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div className="space-y-1">
                            <p className="font-black uppercase tracking-widest">Bukti Pembayaran Ditolak</p>
                            <p className="font-medium">{pendingInvoice.rejectionReason}</p>
                            <p className="mt-2 text-rose-600 dark:text-rose-300 font-bold italic">Mohon unggah ulang bukti transfer yang jelas dan sesuai nominal.</p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row pt-2">
                    <Button asChild className="flex-1 h-12 gap-2 font-black uppercase tracking-widest text-xs bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 shadow-sm transition-all active:scale-95">
                        <Link href={`/subscription/payment/${pendingInvoice.id}`}>
                            Selesaikan Pembayaran Sekarang <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1 h-12 gap-2 font-bold uppercase tracking-widest text-xs border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shadow-none transition-all active:scale-95">
                        <Link href="/subscription/verification-pending">
                            Lihat Status Verifikasi <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                    </Button>
                    {pendingInvoice.status === 'PENDING' && onCancel && (
                        <Button
                            variant="ghost"
                            disabled={isCancelling}
                            onClick={() => onCancel(pendingInvoice.id)}
                            className="h-12 px-6 font-bold uppercase tracking-widest text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 transition-all active:scale-95"
                        >
                            {isCancelling ? 'Membatalkan...' : 'Batalkan'}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
