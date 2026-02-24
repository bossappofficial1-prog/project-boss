import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { OwnerSubscriptionInvoice } from "@/lib/apis/owner-subscription";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES } from "./helper";
import { formatDateTime } from "@/lib/withdrawals";
import { AlertCircle } from "lucide-react";

interface Props {
    pendingInvoice: OwnerSubscriptionInvoice;
}

export function PendingInvoiceCard({ pendingInvoice }: Props) {
    return (
        <Card className="border border-amber-200/20">
            <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-wide text-amber-600">Invoice tertunda</p>
                    <CardTitle className="text-xl">{pendingInvoice.invoiceNumber}</CardTitle>
                    <p className="text-sm text-muted-foreground">Diterbitkan pada {formatDateTime(pendingInvoice.createdAt)}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total tagihan</p>
                    <p className="text-2xl font-semibold text-amber-700">{formatCurrency(pendingInvoice.amount)}</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                    <Badge className={`border text-xs font-semibold ${PAYMENT_STATUS_STYLES[pendingInvoice.status]}`}>
                        {PAYMENT_STATUS_LABELS[pendingInvoice.status]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        Paket {pendingInvoice.plan?.name ?? '-'}
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                    Selesaikan pembayaran untuk mengaktifkan paket hingga {pendingInvoice.plan?.durationDays ?? '-'} hari berikutnya.
                </p>
                {pendingInvoice.status === 'REJECTED_MANUAL' && pendingInvoice.rejectionReason && (
                    <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                        <AlertCircle className="mt-0.5 h-4 w-4" />
                        <div>
                            <p className="font-semibold">Bukti pembayaran ditolak</p>
                            <p>{pendingInvoice.rejectionReason}</p>
                            <p className="mt-1 text-rose-600">Unggah ulang bukti pembayaran yang valid.</p>
                        </div>
                    </div>
                )}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <Button asChild className="flex-1">
                        <Link href={`/subscription/payment/${pendingInvoice.id}`}>
                            Kelola Pembayaran
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                        <Link href="/subscription/verification-pending">
                            Lihat Status Verifikasi
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
