'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  FileText,
  Loader2,
  RefreshCcw,
  Search,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Textarea } from '@/components/ui/textarea';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { useManualPayments } from '@/hooks/useManualPayments';
import { useOutletContext } from '@/components/providers/OutletProvider';
import { formatCurrency } from '@/lib/utils';
import { formatDateTime } from '@/lib/utils/date';
import type {
  ManualPaymentMethod,
  ManualPaymentStatus,
  ManualPaymentTransaction
} from '@/lib/apis/manual-payment';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ManualPaymentStatusFilter } from '@/hooks/useManualPayments';

const ACTIONABLE_STATUSES: ManualPaymentStatus[] = ['PROOF_SUBMITTED', 'AWAITING_VERIFICATION'];

const STATUS_META: Record<ManualPaymentStatus, { label: string; description: string; className: string }> = {
  PENDING: {
    label: 'Menunggu Bukti',
    description: 'Pembeli belum mengunggah bukti pembayaran.',
    className: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200'
  },
  PROOF_SUBMITTED: {
    label: 'Bukti Diterima',
    description: 'Bukti pembayaran sudah diunggah dan menunggu verifikasi.',
    className: 'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
  },
  AWAITING_VERIFICATION: {
    label: 'Menunggu Verifikasi',
    description: 'Perlu tindakan pemilik/outlet untuk verifikasi.',
    className: 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
  },
  SUCCESS: {
    label: 'Terverifikasi',
    description: 'Pembayaran manual berhasil diverifikasi.',
    className: 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
  },
  FAILED: {
    label: 'Gagal',
    description: 'Transaksi gagal diproses.',
    className: 'border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200'
  },
  REFUNDED: {
    label: 'Direfund',
    description: 'Dana telah dikembalikan ke pelanggan.',
    className: 'border-cyan-200 bg-cyan-100 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200'
  },
  EXPIRED: {
    label: 'Kedaluwarsa',
    description: 'Batas waktu pembayaran terlewati.',
    className: 'border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-200'
  },
  CANCELLED: {
    label: 'Dibatalkan',
    description: 'Pesanan dibatalkan sebelum verifikasi.',
    className: 'border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-200'
  },
  REJECTED_MANUAL: {
    label: 'Ditolak',
    description: 'Pembayaran manual ditolak oleh pemilik.',
    className: 'border-red-200 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200'
  }
};

const DEFAULT_STATUS_META = {
  label: 'Status tidak dikenal',
  description: 'Status ini belum dikenali sistem.',
  className: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200'
};

const METHOD_LABELS: Record<ManualPaymentMethod, string> = {
  QRIS_OFFLINE: 'QRIS Offline',
  OWNER_TRANSFER: 'Transfer Pemilik'
};

const STATUS_FILTER_OPTIONS: Array<{ value: ManualPaymentStatusFilter; label: string; description: string }> = [
  { value: 'awaiting', label: 'Butuh Verifikasi', description: 'Tampilkan transaksi dengan bukti siap diperiksa' },
  { value: 'pending', label: 'Menunggu Bukti', description: 'Pembeli belum upload bukti pembayaran' },
  { value: 'approved', label: 'Terverifikasi', description: 'Transaksi manual yang sudah selesai' },
  { value: 'rejected', label: 'Ditolak', description: 'Transaksi manual yang ditolak' },
  { value: 'expired', label: 'Kedaluwarsa', description: 'Sudah melewati batas waktu pembayaran' },
  { value: 'all', label: 'Semua Status', description: 'Tampilkan seluruh riwayat transaksi' }
];

function getStatusMeta(status: ManualPaymentStatus) {
  return STATUS_META[status] ?? DEFAULT_STATUS_META;
}

function formatOrderCode(orderId: string) {
  if (orderId.length <= 12) return orderId;
  return `${orderId.slice(0, 4)}…${orderId.slice(-4)}`;
}

function ManualPaymentStatusBadge({ status }: { status: ManualPaymentStatus }) {
  const meta = getStatusMeta(status);
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  );
}

// DataTable column definitions
const columns: ColumnDef<ManualPaymentTransaction>[] = [
  {
    accessorKey: 'orderId',
    header: 'Pesanan',
    cell: ({ row }) => {
      const payment = row.original;
      return (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">#{formatOrderCode(payment.orderId)}</p>
          <p className="text-xs text-muted-foreground">Dibuat {formatDateTime(payment.order?.createdAt ?? payment.createdAt)}</p>
          {payment.order?.orderStatus && (
            <p className="text-xs text-muted-foreground">
              Status pesanan: <span className="font-medium">{payment.order.orderStatus}</span>
            </p>
          )}
        </div>
      );
    },
    size: 180,
  },
  {
    accessorKey: 'order.guestCustomer.name',
    header: 'Pelanggan',
    cell: ({ row }) => {
      const payment = row.original;
      return (
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {payment.order?.guestCustomer?.name || 'Pelanggan Tanpa Nama'}
          </p>
          {payment.order?.guestCustomer?.phone && (
            <p className="text-xs text-muted-foreground">
              {payment.order.guestCustomer.phone}
            </p>
          )}
        </div>
      );
    },
    size: 200,
  },
  {
    accessorKey: 'order.outlet.name',
    header: 'Outlet',
    cell: ({ row }) => {
      const payment = row.original;
      return (
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {payment.order?.outlet?.name || 'Outlet tidak ditemukan'}
          </p>
          {payment.order?.outlet?.business?.name && (
            <p className="text-xs text-muted-foreground">
              {payment.order.outlet.business.name}
            </p>
          )}
        </div>
      );
    },
    size: 200,
  },
  {
    accessorKey: 'amount',
    header: 'Jumlah',
    cell: ({ row }) => {
      const payment = row.original;
      return (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {formatCurrency(payment.amount)}
          </p>
          <p className="text-xs text-muted-foreground">
            Total pesanan: {formatCurrency(payment.order?.totalAmount ?? payment.amount)}
          </p>
        </div>
      );
    },
    size: 140,
  },
  {
    accessorKey: 'manualMethod',
    header: 'Metode',
    cell: ({ row }) => {
      const payment = row.original;
      const methodLabel = payment.manualMethod ? METHOD_LABELS[payment.manualMethod] ?? payment.manualMethod : '—';
      return (
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{methodLabel}</p>
          {payment.proofUploadedAt && (
            <p className="text-xs text-muted-foreground">
              Bukti diunggah {formatDateTime(payment.proofUploadedAt)}
            </p>
          )}
        </div>
      );
    },
    size: 140,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const payment = row.original;
      const meta = getStatusMeta(payment.status);
      return (
        <div className="space-y-2">
          <ManualPaymentStatusBadge status={payment.status} />
          <p className="text-xs text-muted-foreground">{meta.description}</p>
          {payment.rejectionNote && (
            <p className="text-xs text-destructive">
              Alasan penolakan: {payment.rejectionNote}
            </p>
          )}
          {payment.expiresAt && (
            <p className="text-xs text-muted-foreground">
              Kedaluwarsa {formatDateTime(payment.expiresAt)}
            </p>
          )}
        </div>
      );
    },
    size: 220,
  },
  {
    accessorKey: 'paymentProofUrl',
    header: 'Bukti',
    cell: ({ row }) => {
      const payment = row.original;
      const proofAvailable = Boolean(payment.paymentProofUrl);
      return proofAvailable ? (
        <Button asChild variant="ghost" size="sm">
          <a
            href={payment.paymentProofUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Lihat Bukti
          </a>
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">Belum ada bukti</span>
      );
    },
    size: 140,
  },
];

export default function ManualPaymentsPage() {
  const {
    items,
    loading,
    error,
    page,
    totalPages,
    total,
    limit,
    statusFilter,
    setStatusFilter,
    outletFilter,
    setOutletFilter,
    search,
    setSearch,
    setPage,
    refetch,
    verifyPayment,
    rejectPayment,
    isProcessing,
    setLimit
  } = useManualPayments();

  const { outlets, selectedOutletId } = useOutletContext();

  const [selectedPayment, setSelectedPayment] = useState<ManualPaymentTransaction | null>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  const actionableOnPage = useMemo(
    () => items.filter(item => ACTIONABLE_STATUSES.includes(item.status)).length,
    [items]
  );



  const hasActiveFilters = useMemo(() => {
    const baseOutlet = selectedOutletId ?? 'all';
    return (
      statusFilter !== 'awaiting' ||
      search.trim().length > 0 ||
      outletFilter !== baseOutlet
    );
  }, [statusFilter, search, outletFilter, selectedOutletId]);

  const handleVerifyClick = (payment: ManualPaymentTransaction) => {
    setSelectedPayment(payment);
    setVerifyModalOpen(true);
    setRejectReason('');
    setRejectError(null);
  };

  const handleRejectClick = (payment: ManualPaymentTransaction) => {
    setSelectedPayment(payment);
    setRejectModalOpen(true);
    setRejectReason('');
    setRejectError(null);
  };

  const handleVerifyModalChange = (open: boolean) => {
    setVerifyModalOpen(open);
    if (!open) {
      setSelectedPayment(null);
    }
  };

  const handleRejectModalChange = (open: boolean) => {
    setRejectModalOpen(open);
    if (!open) {
      setSelectedPayment(null);
      setRejectReason('');
      setRejectError(null);
    }
  };

  const confirmVerify = async () => {
    if (!selectedPayment) return;
    await verifyPayment(selectedPayment.orderId);
    setVerifyModalOpen(false);
    setSelectedPayment(null);
  };

  const confirmReject = async () => {
    if (!selectedPayment) return;

    const trimmedReason = rejectReason.trim();
    if (!trimmedReason) {
      setRejectError('Alasan penolakan wajib diisi.');
      return;
    }

    setRejectError(null);
    await rejectPayment(selectedPayment.orderId, trimmedReason);
    setRejectModalOpen(false);
    setSelectedPayment(null);
    setRejectReason('');
  };



  const processingSelected = selectedPayment ? isProcessing(selectedPayment.orderId) : false;

  const handleResetFilters = () => {
    setStatusFilter('awaiting');
    setSearch('');
    setOutletFilter(selectedOutletId ?? 'all');
    setPage(1);
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pembayaran Manual</h1>
          <p className="text-sm text-muted-foreground">
            Pantau bukti transfer dan lakukan verifikasi untuk pesanan manual.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Muat ulang
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              Reset filter
            </Button>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border border-emerald-200/60 dark:border-emerald-800/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Butuh Verifikasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-semibold text-foreground">{actionableOnPage}</p>
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Transaksi pada halaman ini yang menunggu tindakan.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-primary/20 dark:border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Total Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{total.toLocaleString('id-ID')}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Jumlah keseluruhan transaksi manual pada filter yang dipilih.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-blue-200/60 dark:border-blue-800/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-300">
              Transaksi Halaman Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">{items.length}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Banyaknya transaksi yang ditampilkan pada halaman saat ini.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-4 rounded-xl border border-border/60 bg-background p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cari transaksi
            </span>
            <div className="relative">
              <Input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Nama pelanggan, nomor pesanan, atau keterangan..."
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Filter outlet
            </span>
            <Select
              value={outletFilter}
              onValueChange={value => setOutletFilter(value as string | 'all')}
            >
              <SelectTrigger className="w-full min-w-[220px]">
                <SelectValue placeholder="Semua outlet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua outlet</SelectItem>
                {outlets.map(outlet => (
                  <SelectItem key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Data per halaman
            </span>
            <Select
              value={String(limit)}
              onValueChange={value => setLimit(Number(value))}
            >
              <SelectTrigger className="w-full min-w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map(size => (
                  <SelectItem key={size} value={String(size)}>
                    {size} / halaman
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {STATUS_FILTER_OPTIONS.map(option => (
            <Button
              key={option.value}
              variant={statusFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(option.value)}
              className="h-auto items-start px-3 py-2 text-left"
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Gagal memuat data</p>
                <p className="text-sm text-destructive/80">
                  {error}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => refetch()} size="sm">
              Coba lagi
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={items}
        title="Transaksi Pembayaran Manual"
        description="Kelola dan verifikasi pembayaran manual dari pelanggan"
        isLoading={loading}
        isRefreshing={loading}
        onRefresh={refetch}
        pagination={true}
        pageSize={limit}
        pageSizeOptions={[10, 20, 50, 100]}
        emptyMessage="Tidak ada transaksi pembayaran manual ditemukan"
        rowActions={(payment) => {
          const canTakeAction = ACTIONABLE_STATUSES.includes(payment.status);
          if (!canTakeAction) return [];

          return [
            {
              label: 'Verifikasi',
              onClick: () => handleVerifyClick(payment),
              icon: ShieldCheck,
              variant: 'default' as const,
            },
            {
              label: 'Tolak',
              onClick: () => handleRejectClick(payment),
              icon: XCircle,
              variant: 'destructive' as const,
            },
          ];
        }}
      />



      {/* Verify confirmation */}
      <ConfirmationModal
        open={verifyModalOpen && Boolean(selectedPayment)}
        onOpenChange={handleVerifyModalChange}
        title="Verifikasi pembayaran manual?"
        description={
          selectedPayment ? (
            <span>
              Pastikan nominal sebesar{' '}
              <span className="font-semibold">
                {formatCurrency(selectedPayment.amount)}
              </span>{' '}
              sudah diterima sebelum melanjutkan.
            </span>
          ) : ''
        }
        confirmText="Verifikasi"
        confirmVariant="default"
        loading={processingSelected}
        onConfirm={confirmVerify}
      />

      {/* Reject modal */}
      <Dialog open={rejectModalOpen && Boolean(selectedPayment)} onOpenChange={handleRejectModalChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alasan penolakan pembayaran</DialogTitle>
            <DialogDescription>
              Alasan ini akan terlihat oleh kasir dan tercatat di riwayat pesanan.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            placeholder="Tulis alasan penolakan di sini..."
            value={rejectReason}
            onChange={event => setRejectReason(event.target.value)}
            disabled={processingSelected}
          />
          {rejectError && (
            <p className="text-sm text-destructive">{rejectError}</p>
          )}
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleRejectModalChange(false)}
              disabled={processingSelected}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={processingSelected}
            >
              {processingSelected ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Tolak pembayaran
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
