"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
    AlertCircle,
    CheckCircle2,
    FileText,
    Loader2,
    RefreshCcw,
    Search,
    ShieldCheck,
    XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/date";
import type {
    SubscriptionInvoiceRecord,
    SubscriptionInvoiceStatus,
} from "@/lib/apis/admin-subscription-invoices";
import {
    useAdminSubscriptionInvoices,
    type AdminSubscriptionInvoiceStatusFilter,
} from "@/hooks/api/use-admin-subscription-invoices";

const ACTIONABLE_STATUSES: SubscriptionInvoiceStatus[] = ["PROOF_SUBMITTED", "AWAITING_VERIFICATION"];

const STATUS_META: Record<SubscriptionInvoiceStatus, { label: string; description: string; tone: string }> = {
    PENDING: {
        label: "Menunggu Bukti",
        description: "Merchant belum mengunggah bukti pembayaran.",
        tone: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-800",
    },
    PROOF_SUBMITTED: {
        label: "Bukti Masuk",
        description: "Bukti pembayaran menunggu validasi tim admin.",
        tone: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800",
    },
    AWAITING_VERIFICATION: {
        label: "Butuh Validasi",
        description: "Verifikasi manual diperlukan untuk mengaktifkan paket.",
        tone: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800",
    },
    SUCCESS: {
        label: "Terverifikasi",
        description: "Invoice telah disetujui dan paket aktif.",
        tone: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800",
    },
    FAILED: {
        label: "Gagal",
        description: "Pembayaran dinyatakan gagal.",
        tone: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800",
    },
    REFUNDED: {
        label: "Direfund",
        description: "Dana dikembalikan kepada merchant.",
        tone: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-200 dark:border-cyan-800",
    },
    EXPIRED: {
        label: "Kedaluwarsa",
        description: "Batas pembayaran invoice telah habis.",
        tone: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/40 dark:text-gray-200 dark:border-gray-800",
    },
    CANCELLED: {
        label: "Dibatalkan",
        description: "Invoice dibatalkan oleh sistem.",
        tone: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/40 dark:text-gray-200 dark:border-gray-800",
    },
    REJECTED_MANUAL: {
        label: "Ditolak",
        description: "Bukti pembayaran tidak valid.",
        tone: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800",
    },
};

const STATUS_FILTERS: Array<{ value: AdminSubscriptionInvoiceStatusFilter; label: string; description: string }> = [
    { value: "awaiting", label: "Butuh Validasi", description: "Bukti siap diperiksa admin" },
    { value: "pending", label: "Menunggu Bukti", description: "Merchant belum upload bukti" },
    { value: "approved", label: "Terverifikasi", description: "Invoice telah aktif" },
    { value: "rejected", label: "Ditolak", description: "Perlu follow-up ulang" },
    { value: "expired", label: "Kedaluwarsa", description: "Batas pembayaran habis" },
    { value: "all", label: "Semua Status", description: "Tampilkan seluruh data" },
];

function formatInvoiceCode(invoiceNumber: string) {
    if (invoiceNumber.length <= 12) return invoiceNumber;
    return `${invoiceNumber.slice(0, 6)}…${invoiceNumber.slice(-4)}`;
}

function InvoiceStatusBadge({ status }: { status: SubscriptionInvoiceStatus }) {
    const meta = STATUS_META[status];
    return (
        <Badge variant="outline" className={`border ${meta.tone}`}>
            {meta.label}
        </Badge>
    );
}

const baseColumns: ColumnDef<SubscriptionInvoiceRecord>[] = [
    {
        accessorKey: "invoiceNumber",
        header: "Invoice",
        size: 220,
        cell: ({ row }) => {
            const invoice = row.original;
            return (
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">#{formatInvoiceCode(invoice.invoiceNumber)}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(invoice.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">{invoice.subscription.plan.name}</p>
                </div>
            );
        },
    },
    {
        accessorKey: "business",
        header: "Bisnis",
        size: 220,
        cell: ({ row }) => {
            const invoice = row.original;
            const owner = invoice.business.owner;
            return (
                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{invoice.business.name}</p>
                    {owner?.name && (
                        <p className="text-xs text-muted-foreground">{owner.name} · {owner.email}</p>
                    )}
                    {owner?.phone && <p className="text-xs text-muted-foreground">{owner.phone}</p>}
                </div>
            );
        },
    },
    {
        accessorKey: "amount",
        header: "Nominal",
        size: 150,
        cell: ({ row }) => {
            const invoice = row.original;
            return (
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(invoice.amount)}</p>
                    <p className="text-xs text-muted-foreground">{invoice.subscription.plan.durationDays} hari · {invoice.subscription.plan.code}</p>
                </div>
            );
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        size: 220,
        cell: ({ row }) => {
            const invoice = row.original;
            return (
                <div className="space-y-1">
                    <InvoiceStatusBadge status={invoice.status} />
                    <p className="text-xs text-muted-foreground">{STATUS_META[invoice.status].description}</p>
                    {invoice.rejectionReason && <p className="text-xs text-destructive">{invoice.rejectionReason}</p>}
                    {invoice.proofUploadedAt && (
                        <p className="text-xs text-muted-foreground">Bukti dikirim {formatDateTime(invoice.proofUploadedAt)}</p>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: "proofImage",
        header: "Bukti",
        size: 140,
        cell: ({ row }) => {
            const invoice = row.original;
            return invoice.proofImage ? (
                <Button asChild variant="ghost" size="sm" className="gap-2 text-blue-600 hover:text-blue-700">
                    <a href={invoice.proofImage} target="_blank" rel="noreferrer">
                        <FileText className="h-4 w-4" />
                        Lihat Bukti
                    </a>
                </Button>
            ) : (
                <span className="text-xs text-muted-foreground">Belum ada bukti</span>
            );
        },
    },
];

export default function AdminSubscriptionInvoicesPage() {
    const {
        invoices,
        total,
        totalPages,
        isLoading,
        isRefetching,
        error,
        statusFilter,
        setStatusFilter,
        search,
        setSearch,
        page,
        setPage,
        limit,
        setLimit,
        refetch,
        verifyInvoice,
        rejectInvoice,
        isProcessing,
    } = useAdminSubscriptionInvoices();

    const [pendingAction, setPendingAction] = useState<{
        type: "verify" | "reject";
        invoice: SubscriptionInvoiceRecord;
    } | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const actionableCount = useMemo(
        () => invoices.filter((invoice) => ACTIONABLE_STATUSES.includes(invoice.status)).length,
        [invoices]
    );

    const columns = useMemo<ColumnDef<SubscriptionInvoiceRecord>[]>(() => {
        return [
            ...baseColumns,
            {
                id: "actions",
                header: "Aksi",
                size: 160,
                cell: ({ row }) => {
                    const invoice = row.original;
                    const actionable = ACTIONABLE_STATUSES.includes(invoice.status);
                    const busy = isProcessing(invoice.id);

                    if (!actionable) {
                        return <span className="text-xs text-muted-foreground">Tidak ada aksi</span>;
                    }

                    return (
                        <div className="flex flex-col gap-2">
                            <Button
                                size="sm"
                                className="gap-2"
                                disabled={busy}
                                onClick={() => setPendingAction({ type: "verify", invoice })}
                            >
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                                Verifikasi
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                disabled={busy}
                                onClick={() => setPendingAction({ type: "reject", invoice })}
                            >
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 text-destructive" />}
                                Tolak
                            </Button>
                        </div>
                    );
                },
            },
        ];
    }, [isProcessing]);

    const activeFilter = STATUS_FILTERS.find((item) => item.value === statusFilter);

    const handleConfirm = async () => {
        if (!pendingAction) return;
        const { invoice, type } = pendingAction;

        if (type === "verify") {
            await verifyInvoice(invoice.id);
        } else {
            const trimmed = rejectReason.trim();
            if (!trimmed) return;
            await rejectInvoice({ invoiceId: invoice.id, reason: trimmed });
            setRejectReason("");
        }

        setPendingAction(null);
    };

    const dialogTitle = pendingAction?.type === "reject" ? "Tolak invoice langganan" : "Verifikasi invoice langganan";
    const dialogDescription = pendingAction?.type === "reject"
        ? "Pastikan alasan penolakan jelas agar merchant memahami koreksi yang dibutuhkan."
        : "Cek kembali nominal dan bukti transfer sebelum mengaktifkan paket langganan.";
    const selectedInvoice = pendingAction?.invoice;

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Subscription Risk Desk</p>
                        <h1 className="mt-2 text-3xl font-semibold">Validasi Bukti Pembayaran Langganan</h1>
                        <p className="mt-3 max-w-2xl text-sm text-slate-300">
                            Review setiap bukti transfer yang dikirim merchant, aktifkan paket dengan satu klik, dan pastikan arus pendapatan SaaS tetap sehat.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="secondary" size="sm" className="gap-2" onClick={() => refetch()} disabled={isRefetching}>
                            <RefreshCcw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                            Refresh data
                        </Button>
                    </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <Card className="border-none bg-white/10 text-white backdrop-blur">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-200">Butuh Validasi</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-semibold">{actionableCount}</p>
                                <p className="text-xs text-slate-200">Invoice menunggu keputusan admin</p>
                            </div>
                            <ShieldCheck className="h-10 w-10 text-emerald-300" />
                        </CardContent>
                    </Card>
                    <Card className="border-none bg-white/10 text-white backdrop-blur">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-200">Total Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold">{total.toLocaleString('id-ID')}</p>
                            <p className="text-xs text-slate-200">Sesuai filter yang aktif</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none bg-white/10 text-white backdrop-blur">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-200">Status Filter</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-semibold">{activeFilter?.label}</p>
                            <p className="text-xs text-slate-200">{activeFilter?.description}</p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="rounded-2xl border border-border/80 bg-background p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="flex-1 space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cari invoice</p>
                        <div className="relative">
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Nama bisnis, nomor invoice, nama owner"
                                className="pl-9"
                            />
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tampilkan</p>
                        <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 20, 30, 50].map((item) => (
                                    <SelectItem key={item} value={item.toString()}>
                                        {item} baris
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {STATUS_FILTERS.map((filter) => (
                        <Button
                            key={filter.value}
                            variant={statusFilter === filter.value ? 'default' : 'outline'}
                            className="rounded-full border-muted-foreground/20 px-4 font-medium"
                            onClick={() => setStatusFilter(filter.value)}
                        >
                            {filter.label}
                        </Button>
                    ))}
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/60 bg-background p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Daftar Invoice Langganan</h2>
                        {error ? (
                            <p className="flex items-center gap-2 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">{invoices.length} data pada halaman ini</p>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>
                            Halaman {page} / {totalPages}
                        </span>
                        <div className="flex rounded-full border">
                            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                                -
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage(page + 1)}
                            >
                                +
                            </Button>
                        </div>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={invoices}
                    isLoading={isLoading}
                    pagination={false}
                    showColumnVisibility={false}
                    showTableInfo={false}
                    emptyMessage="Tidak ada invoice langganan pada filter ini."
                />
            </section>

            <Dialog open={Boolean(pendingAction)} onOpenChange={(open) => {
                if (!open) {
                    setPendingAction(null);
                    setRejectReason('');
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialogTitle}</DialogTitle>
                        <DialogDescription>{dialogDescription}</DialogDescription>
                    </DialogHeader>

                    {selectedInvoice && (
                        <div className="space-y-4 text-sm">
                            <div className="rounded-lg border border-border/70 p-3">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Invoice</p>
                                <p className="text-base font-semibold">#{formatInvoiceCode(selectedInvoice.invoiceNumber)}</p>
                                <p className="text-xs text-muted-foreground">
                                    {selectedInvoice.business.name} · {formatCurrency(selectedInvoice.amount)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Paket {selectedInvoice.subscription.plan.name} · {selectedInvoice.subscription.plan.durationDays} hari
                                </p>
                            </div>
                            {pendingAction?.type === 'reject' && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Alasan penolakan
                                    </p>
                                    <Textarea
                                        value={rejectReason}
                                        onChange={(event) => setRejectReason(event.target.value)}
                                        placeholder="Contoh: Nominal bukti tidak sesuai invoice"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setPendingAction(null)}>
                            Batalkan
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={pendingAction?.type === 'reject' && rejectReason.trim().length === 0}
                            className="gap-2"
                        >
                            {pendingAction?.type === 'reject' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            {pendingAction?.type === 'reject' ? 'Tolak invoice' : 'Verifikasi invoice'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
