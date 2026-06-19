"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
    AlertCircle,
    FileText,
    Loader2,
    RefreshCcw,
    Search,
    ShieldCheck,
    XCircle,
} from "lucide-react";
import { gooeyToast } from "goey-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Textarea } from "@/components/ui/textarea";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useOutletStore } from "@/stores/outlet.store";
import { formatCurrency } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/date";
import {
    manualPaymentApi,
    type ManualPaymentStatus,
    type ManualPaymentMethod,
    type ManualPaymentTransaction,
    type ManualPaymentListParams,
    type ManualPaymentListResponse,
} from "@/lib/apis/manual-payment";

type StatusFilter = "awaiting" | "all" | "pending" | "approved" | "rejected" | "expired";

const ACTIONABLE_STATUSES: ManualPaymentStatus[] = ["PROOF_SUBMITTED", "AWAITING_VERIFICATION"];

const STATUS_PRESETS: Record<Exclude<StatusFilter, "all">, ManualPaymentStatus[]> = {
    pending: ["PENDING"],
    awaiting: ["PROOF_SUBMITTED", "AWAITING_VERIFICATION"],
    approved: ["SUCCESS"],
    rejected: ["REJECTED_MANUAL"],
    expired: ["EXPIRED"],
};

const STATUS_META: Record<ManualPaymentStatus, { label: string; className: string }> = {
    PENDING: {
        label: "Menunggu Bukti",
        className: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200",
    },
    PROOF_SUBMITTED: {
        label: "Bukti Diterima",
        className: "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
    },
    AWAITING_VERIFICATION: {
        label: "Menunggu Verifikasi",
        className: "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
    },
    SUCCESS: {
        label: "Terverifikasi",
        className: "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
    },
    FAILED: {
        label: "Gagal",
        className: "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200",
    },
    REFUNDED: {
        label: "Direfund",
        className: "border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200",
    },
    EXPIRED: {
        label: "Kedaluwarsa",
        className: "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-200",
    },
    CANCELLED: {
        label: "Dibatalkan",
        className: "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-200",
    },
    REJECTED_MANUAL: {
        label: "Ditolak",
        className: "border-red-200 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200",
    },
};

const METHOD_LABELS: Record<ManualPaymentMethod, string> = {
    QRIS_OFFLINE: "QRIS Offline",
    OWNER_TRANSFER: "Transfer Pemilik",
};

const FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
    { value: "awaiting", label: "Butuh Verifikasi" },
    { value: "pending", label: "Menunggu Bukti" },
    { value: "approved", label: "Terverifikasi" },
    { value: "rejected", label: "Ditolak" },
    { value: "expired", label: "Kedaluwarsa" },
    { value: "all", label: "Semua" },
];

function formatOrderCode(id: string) {
    return id.length <= 12 ? id : `${id.slice(0, 4)}…${id.slice(-4)}`;
}

const columns: ColumnDef<ManualPaymentTransaction>[] = [
    {
        accessorKey: "orderId",
        header: "Pesanan",
        cell: ({ row }) => {
            const p = row.original;
            return (
                <div className="space-y-1">
                    <p className="text-sm font-semibold">#{formatOrderCode(p.orderId)}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatDateTime(p.order?.createdAt ?? p.createdAt)}
                    </p>
                </div>
            );
        },
        size: 160,
    },
    {
        accessorKey: "order.guestCustomer.name",
        header: "Pelanggan",
        cell: ({ row }) => {
            const p = row.original;
            return (
                <div className="space-y-1">
                    <p className="text-sm font-medium">
                        {p.order?.guestCustomer?.name || "Tanpa Nama"}
                    </p>
                    {p.order?.guestCustomer?.phone && (
                        <p className="text-xs text-muted-foreground">{p.order.guestCustomer.phone}</p>
                    )}
                </div>
            );
        },
        size: 160,
    },
    {
        accessorKey: "amount",
        header: "Jumlah",
        cell: ({ row }) => (
            <p className="text-sm font-semibold">{formatCurrency(row.original.amount)}</p>
        ),
        size: 120,
    },
    {
        accessorKey: "manualMethod",
        header: "Metode",
        cell: ({ row }) => {
            const p = row.original;
            const label = p.manualMethod ? (METHOD_LABELS[p.manualMethod] ?? p.manualMethod) : "—";
            return (
                <div className="space-y-1">
                    <p className="text-sm">{label}</p>
                    {p.proofUploadedAt && (
                        <p className="text-xs text-muted-foreground">
                            Bukti: {formatDateTime(p.proofUploadedAt)}
                        </p>
                    )}
                </div>
            );
        },
        size: 140,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const p = row.original;
            const meta = STATUS_META[p.status] ?? { label: p.status, className: "" };
            return (
                <div className="space-y-1">
                    <Badge variant="outline" className={meta.className}>
                        {meta.label}
                    </Badge>
                    {p.rejectionNote && (
                        <p className="text-xs text-destructive">Alasan: {p.rejectionNote}</p>
                    )}
                </div>
            );
        },
        size: 180,
    },
    {
        accessorKey: "paymentProofUrl",
        header: "Bukti",
        cell: ({ row }) => {
            const url = row.original.paymentProofUrl;
            return url ? (
                <Button asChild variant="ghost" size="sm">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Lihat
                    </a>
                </Button>
            ) : (
                <span className="text-xs text-muted-foreground">Belum ada</span>
            );
        },
        size: 100,
    },
];

export default function PaymentConfirmContent() {
    const { selectedOutletId } = useOutletStore();

    const [items, setItems] = useState<ManualPaymentTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("awaiting");
    const [search, setSearch] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    const [selected, setSelected] = useState<ManualPaymentTransaction | null>(null);
    const [verifyOpen, setVerifyOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectError, setRejectError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!selectedOutletId) return;
        try {
            setLoading(true);
            setError(null);
            const params: ManualPaymentListParams = {
                page,
                limit,
                outletId: selectedOutletId,
            };
            if (statusFilter !== "all") {
                params.status = STATUS_PRESETS[statusFilter];
            }
            if (search.trim()) {
                params.search = search.trim();
            }
            const result: ManualPaymentListResponse = await manualPaymentApi.list(params);
            setItems(result.data || []);
            setTotal(result.total || 0);
            setTotalPages(result.totalPages || 1);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Gagal memuat data";
            setError(msg);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [selectedOutletId, page, limit, statusFilter, search]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const actionableCount = useMemo(
        () => items.filter((i) => ACTIONABLE_STATUSES.includes(i.status)).length,
        [items]
    );

    const handleVerifyClick = (p: ManualPaymentTransaction) => {
        setSelected(p);
        setVerifyOpen(true);
    };

    const handleRejectClick = (p: ManualPaymentTransaction) => {
        setSelected(p);
        setRejectOpen(true);
        setRejectReason("");
        setRejectError(null);
    };

    const confirmVerify = async () => {
        if (!selected) return;
        setProcessingId(selected.orderId);
        try {
            await manualPaymentApi.verify(selected.orderId);
            gooeyToast.success("Pembayaran berhasil diverifikasi");
            setVerifyOpen(false);
            setSelected(null);
            await fetchData();
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Gagal memverifikasi";
            gooeyToast.error(msg);
        } finally {
            setProcessingId(null);
        }
    };

    const confirmReject = async () => {
        if (!selected) return;
        const reason = rejectReason.trim();
        if (!reason) {
            setRejectError("Alasan penolakan wajib diisi.");
            return;
        }
        setProcessingId(selected.orderId);
        try {
            await manualPaymentApi.reject(selected.orderId, reason);
            gooeyToast.warning("Pembayaran ditolak");
            setRejectOpen(false);
            setSelected(null);
            setRejectReason("");
            await fetchData();
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Gagal menolak";
            gooeyToast.error(msg);
        } finally {
            setProcessingId(null);
        }
    };

    const isProcessing = processingId === selected?.orderId;

    return (
        <div className="space-y-3 p-4">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Konfirmasi Pembayaran</h1>
                    <p className="text-sm text-muted-foreground">
                        Verifikasi bukti transfer dari pelanggan.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                    <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Muat ulang
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-3 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            Butuh Verifikasi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <p className="text-3xl font-semibold">{actionableCount}</p>
                            <ShieldCheck className="h-6 w-6 text-emerald-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold">{total}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="space-y-3 rounded-md border p-3">
                <div className="relative">
                    <Input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Cari nama / nomor pesanan..."
                        className="pl-9"
                    />
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                <div className="flex flex-wrap gap-2">
                    {FILTER_OPTIONS.map((opt) => (
                        <Button
                            key={opt.value}
                            variant={statusFilter === opt.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => { setStatusFilter(opt.value); setPage(1); }}
                        >
                            {opt.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Error */}
            {error && (
                <Card className="border-destructive/40 bg-destructive/5">
                    <CardContent className="flex items-center gap-3 py-4">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <p className="text-sm text-destructive">{error}</p>
                        <Button variant="outline" size="sm" onClick={fetchData} className="ml-auto">
                            Coba lagi
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Table */}
            <DataTable
                columns={columns}
                data={items}
                isLoading={loading}
                isRefreshing={loading}
                onRefresh={fetchData}
                pagination
                serverSidePagination
                totalItems={total}
                serverPage={page}
                serverLimit={limit}
                onPaginationChange={({ page: p }) => setPage(p)}
                emptyMessage="Tidak ada transaksi pembayaran manual"
                rowActions={(payment) => {
                    if (!ACTIONABLE_STATUSES.includes(payment.status)) return [];
                    return [
                        {
                            label: "Verifikasi",
                            onClick: () => handleVerifyClick(payment),
                            icon: ShieldCheck,
                            variant: "default" as const,
                        },
                        {
                            label: "Tolak",
                            onClick: () => handleRejectClick(payment),
                            icon: XCircle,
                            variant: "destructive" as const,
                        },
                    ];
                }}
            />

            {/* Verify modal */}
            <ConfirmationModal
                open={verifyOpen && Boolean(selected)}
                onOpenChange={(open) => {
                    setVerifyOpen(open);
                    if (!open) setSelected(null);
                }}
                title="Verifikasi pembayaran manual?"
                description={
                    selected ? (
                        <span>
                            Pastikan nominal{" "}
                            <span className="font-semibold">{formatCurrency(selected.amount)}</span>{" "}
                            sudah diterima sebelum melanjutkan.
                        </span>
                    ) : ""
                }
                confirmText="Verifikasi"
                confirmVariant="default"
                loading={isProcessing}
                onConfirm={confirmVerify}
            />

            {/* Reject modal */}
            <Dialog
                open={rejectOpen && Boolean(selected)}
                onOpenChange={(open) => {
                    setRejectOpen(open);
                    if (!open) {
                        setSelected(null);
                        setRejectReason("");
                        setRejectError(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Alasan penolakan</DialogTitle>
                        <DialogDescription>
                            Alasan ini akan tercatat di riwayat pesanan.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        rows={4}
                        placeholder="Tulis alasan penolakan..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        disabled={isProcessing}
                    />
                    {rejectError && <p className="text-sm text-destructive">{rejectError}</p>}
                    <DialogFooter className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRejectOpen(false);
                                setSelected(null);
                                setRejectReason("");
                                setRejectError(null);
                            }}
                            disabled={isProcessing}
                        >
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={confirmReject} disabled={isProcessing}>
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Tolak
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
