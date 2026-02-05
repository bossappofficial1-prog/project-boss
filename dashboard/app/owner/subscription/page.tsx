'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  RefreshCw,
  Repeat2,
  ShieldCheck,
  Store,
  Package2,
  Users,
  ReceiptText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useOwnerSubscriptionInvoices,
  useOwnerSubscriptionOverview,
  useRenewSubscription,
} from '@/hooks/api/use-owner-subscription';
import type {
  OwnerSubscriptionStatus,
  OwnerPaymentStatus,
  SubscriptionPlanFeatures,
} from '@/lib/apis/owner-subscription';
import { formatCurrency } from '@/lib/utils';
import { formatDate, formatDateTime } from '@/lib/utils/date';
import { cn } from '@/lib/utils';

const SUBSCRIPTION_STATUS_LABELS: Record<OwnerSubscriptionStatus, string> = {
  ACTIVE: 'Aktif',
  TRIAL: 'Masa Uji Coba',
  AWAITING_PAYMENT: 'Menunggu Pembayaran',
  PROOF_SUBMITTED: 'Bukti Dikirim',
  PAST_DUE: 'Tertunggak',
  EXPIRED: 'Berakhir',
  SUSPENDED: 'Ditangguhkan',
  CANCELLED: 'Dibatalkan',
};

const SUBSCRIPTION_STATUS_STYLES: Record<OwnerSubscriptionStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  TRIAL: 'bg-sky-100 text-sky-700 border-sky-200',
  AWAITING_PAYMENT: 'bg-amber-100 text-amber-700 border-amber-200',
  PROOF_SUBMITTED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  PAST_DUE: 'bg-orange-100 text-orange-700 border-orange-200',
  EXPIRED: 'bg-rose-100 text-rose-700 border-rose-200',
  SUSPENDED: 'bg-slate-200 text-slate-700 border-slate-300',
  CANCELLED: 'bg-gray-200 text-gray-700 border-gray-300',
};

const PAYMENT_STATUS_LABELS: Record<OwnerPaymentStatus, string> = {
  PENDING: 'Menunggu Pembayaran',
  PROOF_SUBMITTED: 'Bukti Dikirim',
  AWAITING_VERIFICATION: 'Menunggu Verifikasi',
  SUCCESS: 'Berhasil',
  FAILED: 'Gagal',
  REFUNDED: 'Dana Dikembalikan',
  EXPIRED: 'Kadaluarsa',
  CANCELLED: 'Dibatalkan',
  REJECTED_MANUAL: 'Ditolak',
};

const PAYMENT_STATUS_STYLES: Record<OwnerPaymentStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  PROOF_SUBMITTED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  AWAITING_VERIFICATION: 'bg-blue-100 text-blue-700 border-blue-200',
  SUCCESS: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  FAILED: 'bg-rose-100 text-rose-700 border-rose-200',
  REFUNDED: 'bg-slate-200 text-slate-700 border-slate-300',
  EXPIRED: 'bg-orange-100 text-orange-700 border-orange-200',
  CANCELLED: 'bg-gray-200 text-gray-700 border-gray-300',
  REJECTED_MANUAL: 'bg-red-100 text-red-700 border-red-200',
};

const PAYMENT_ACTIONABLE_STATUSES: OwnerPaymentStatus[] = ['PENDING', 'PROOF_SUBMITTED', 'AWAITING_VERIFICATION'];

const PAGE_SIZE = 6;

type UsageMetric = 'outlets' | 'products' | 'staff';

const usageCardsConfig: Array<{
  key: UsageMetric;
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
}> = [
    {
      key: 'outlets',
      label: 'Outlet Aktif',
      description: 'Jumlah outlet yang sedang berjalan',
      icon: Store,
      accent: 'from-rose-50 to-white border-rose-100',
    },
    {
      key: 'products',
      label: 'Produk & Layanan',
      description: 'Item yang bisa dijual di semua outlet',
      icon: Package2,
      accent: 'from-orange-50 to-white border-orange-100',
    },
    {
      key: 'staff',
      label: 'Staf Outlet',
      description: 'Kasir dan petugas yang aktif',
      icon: Users,
      accent: 'from-amber-50 to-white border-amber-100',
    },
  ];

const parsePlanFeatures = (raw: unknown): SubscriptionPlanFeatures | null => {
  if (!raw) return null;
  if (typeof raw === 'object') return raw as SubscriptionPlanFeatures;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as SubscriptionPlanFeatures;
    } catch {
      return null;
    }
  }
  return null;
};

const formatLimitLabel = (limit?: number) => {
  if (limit === undefined || limit === null) return 'Tidak tersedia';
  if (limit === -1) return 'Tanpa batas';
  return `${limit.toLocaleString('id-ID')} slot`;
};

const calcUsagePercentage = (used?: number, limit?: number) => {
  if (limit === undefined || limit === null || limit <= 0) return 0;
  if (limit === -1) return 0;
  return Math.min(Math.round((Number(used ?? 0) / limit) * 100), 100);
};

const getDaysRemaining = (dateString?: string | null) => {
  if (!dateString) return null;
  const end = new Date(dateString).getTime();
  if (Number.isNaN(end)) return null;
  const diff = end - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default function OwnerSubscriptionPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = PAGE_SIZE;

  const overviewQuery = useOwnerSubscriptionOverview();
  const invoicesQuery = useOwnerSubscriptionInvoices({ page, limit });
  const renewMutation = useRenewSubscription();

  const overview = overviewQuery.data;
  const plan = overview?.plan ?? null;
  const usage = overview?.usage;
  const pendingInvoice = overview?.pendingInvoice ?? null;
  const planFeatures = useMemo(() => parsePlanFeatures(plan?.features), [plan?.features]);
  const endsAt = overview?.business?.subscriptionEndDate ?? usage?.subscription?.endsAt ?? null;
  const daysLeft = getDaysRemaining(endsAt);

  const totalPages = Math.max(invoicesQuery.data?.totalPages ?? 1, 1);
  const overviewErrorMessage =
    overviewQuery.error instanceof Error
      ? overviewQuery.error.message
      : (overviewQuery.error as { message?: string })?.message;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleRenew = async () => {
    if (!plan || renewMutation.isPending) return;
    try {
      const result = await renewMutation.mutateAsync({ planCode: plan.code });
      if (result?.invoice?.id) {
        router.push(`/subscription/payment?invoiceId=${result.invoice.id}`);
      }
    } catch {
      /* toast handled inside hook */
    }
  };

  const handleRefresh = () => {
    overviewQuery.refetch();
    invoicesQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Langganan</p>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Status Langganan Bisnis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau masa aktif paket, pemakaian kuota, dan riwayat pembayaran langganan secara real-time.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={overviewQuery.isFetching || invoicesQuery.isFetching}
          >
            <RefreshCw
              className={cn('mr-2 h-4 w-4', {
                'animate-spin': overviewQuery.isFetching || invoicesQuery.isFetching,
              })}
            />
            Segarkan Data
          </Button>
          <Button
            size="sm"
            onClick={handleRenew}
            disabled={!plan || renewMutation.isPending}
          >
            {renewMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Repeat2 className="mr-2 h-4 w-4" />
            )}
            Perpanjang Langganan
          </Button>
        </div>
      </div>

      {overviewQuery.error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <div>
            <p className="font-semibold">Gagal memuat data langganan</p>
            <p>{overviewErrorMessage ?? 'Coba segarkan ulang halaman.'}</p>
          </div>
        </div>
      )}

      {overviewQuery.isLoading ? (
        <SubscriptionSkeleton />
      ) : overview ? (
        <>
          <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card className="border border-red-100 bg-gradient-to-br from-red-50 via-white to-white shadow-sm">
              <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                      {plan?.name ?? 'Paket Tidak Diketahui'}
                    </CardTitle>
                    {overview.business?.subscriptionStatus && (
                      <Badge className={cn('border text-xs font-semibold', SUBSCRIPTION_STATUS_STYLES[overview.business.subscriptionStatus])}>
                        {SUBSCRIPTION_STATUS_LABELS[overview.business.subscriptionStatus]}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Berlaku selama {plan?.durationDays ?? '-'} hari • {plan?.code}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Biaya langganan</p>
                  <p className="text-3xl font-bold text-red-600">{plan ? formatCurrency(plan.price) : '-'}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-red-100 bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Aktif sejak</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(overview.business?.subscriptionStartDate ?? '-')}
                    </p>
                  </div>
                  <div className="rounded-xl border border-red-100 bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Berakhir pada</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {endsAt ? formatDate(endsAt) : '-'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-red-100 bg-white/80 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Sisa waktu</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {daysLeft === null ? '-' : daysLeft === 0 ? 'Berakhir hari ini' : `${daysLeft} hari`}
                      </p>
                    </div>
                    <ShieldCheck className="h-8 w-8 text-red-500" />
                  </div>
                </div>

                <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white/90 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <CreditCard className="h-4 w-4" />
                    <span>{overview.business?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock3 className="h-4 w-4" />
                    <span>Status diterbitkan pada {formatDateTime(overview.business?.subscriptionStartDate ?? '')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-gradient-to-b from-slate-50 to-white">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Fitur Paket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                {planFeatures ? (
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-semibold">Outlet</p>
                        <p className="text-muted-foreground">{formatLimitLabel(planFeatures.maxOutlets)}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Package2 className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-semibold">Produk & layanan</p>
                        <p className="text-muted-foreground">{formatLimitLabel(planFeatures.maxProducts)}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-semibold">Tim staf</p>
                        <p className="text-muted-foreground">{formatLimitLabel(planFeatures.maxStaff)}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-semibold">Ekspor laporan</p>
                        <p className="text-muted-foreground">
                          {planFeatures.canExportReport ? 'Semua laporan dapat diunduh' : 'Ekspor laporan tidak tersedia'}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <ReceiptText className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-semibold">Level dukungan</p>
                        <p className="text-muted-foreground">
                          {planFeatures.supportLevel === 'PRIORITY'
                            ? 'Prioritas (Direct channel)'
                            : planFeatures.supportLevel === 'WHATSAPP'
                              ? 'Chat WhatsApp bisnis'
                              : 'Email support'}
                        </p>
                      </div>
                    </li>
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Fitur paket tidak tersedia.</p>
                )}
                <Button variant="secondary" className="w-full mt-4" onClick={handleRenew} disabled={!plan || renewMutation.isPending}>
                  {renewMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Perpanjang paket ini
                </Button>
              </CardContent>
            </Card>
          </section>

          {usage && (
            <section className="grid gap-4 md:grid-cols-3">
              {usageCardsConfig.map((card) => {
                const data = usage?.[card.key];
                const limit = (data as any)?.limit;
                const used = (data as any)?.used;
                const remaining = (data as any)?.remaining;
                const percentage = calcUsagePercentage(used, limit);

                const Icon = card.icon;
                return (
                  <Card key={card.key} className={cn('border shadow-sm', card.accent.includes('from') ? `bg-gradient-to-br ${card.accent}` : card.accent)}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-900">{card.label}</CardTitle>
                      <div className="rounded-lg bg-white/60 p-2">
                        <Icon className="h-5 w-5 text-red-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold text-gray-900">{used ?? 0}</p>
                      <p className="text-xs text-muted-foreground">{card.description}</p>
                      {limit === -1 ? (
                        <p className="mt-3 text-xs font-semibold text-emerald-600">Tanpa batas</p>
                      ) : (
                        <>
                          <Progress value={percentage} className="mt-3 h-2 bg-white/80" />
                          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{remaining ?? 0} sisa kuota</span>
                            <span>Limit {limit ?? '-'} </span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          )}

          <section>
            {pendingInvoice ? (
              <Card className="border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white">
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
                    <Badge className={cn('border text-xs font-semibold', PAYMENT_STATUS_STYLES[pendingInvoice.status])}>
                      {PAYMENT_STATUS_LABELS[pendingInvoice.status]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Paket {pendingInvoice.plan?.name ?? '-'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Selesaikan pembayaran untuk mengaktifkan paket hingga {pendingInvoice.plan?.durationDays ?? '-'} hari berikutnya.
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button asChild className="flex-1">
                      <Link href={`/subscription/payment?invoiceId=${pendingInvoice.id}`}>
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
            ) : (
              <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                <CardContent className="flex flex-col gap-3 p-6 text-sm text-emerald-800 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-emerald-900">Tidak ada tagihan tertunda</p>
                    <p>Paket langganan Anda aktif sepenuhnya. Buat perpanjangan kapan pun dibutuhkan.</p>
                  </div>
                  <Button variant="secondary" className="w-full md:w-auto" onClick={handleRenew} disabled={!plan || renewMutation.isPending}>
                    {renewMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-4 w-4" />
                    )}
                    Buat Invoice Perpanjangan
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>

          <InvoiceHistorySection
            query={invoicesQuery}
            page={page}
            limit={limit}
            onPageChange={setPage}
          />
        </>
      ) : (
        <Card className="border border-dashed border-slate-200 bg-slate-50">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <ShieldCheck className="h-10 w-10 text-slate-400" />
            <h3 className="text-lg font-semibold text-gray-800">Belum ada paket langganan aktif</h3>
            <p className="text-sm text-muted-foreground">
              Kami tidak menemukan paket langganan untuk bisnis Anda. Hubungi tim dukungan untuk menyalakan akses dashboard.
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" /> Coba Muat Ulang
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface InvoiceHistorySectionProps {
  query: ReturnType<typeof useOwnerSubscriptionInvoices>;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
}

function InvoiceHistorySection({ query, page, limit, onPageChange }: InvoiceHistorySectionProps) {
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(query.data?.totalPages ?? 1, 1);
  const firstItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastItem = total === 0 ? 0 : Math.min(page * limit, total);

  const rows = query.data?.data ?? [];

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <Card className="border border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg">Riwayat Invoice</CardTitle>
        <p className="text-sm text-muted-foreground">Pantau seluruh aktivitas pembayaran langganan Anda.</p>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                [...Array(limit)].map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    Belum ada riwayat pembayaran langganan.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{invoice.invoiceNumber}</span>
                        <span className="text-xs text-muted-foreground">#{invoice.id.slice(0, 6)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{invoice.plan?.name ?? '-'}</span>
                        <span className="text-xs text-muted-foreground">{invoice.plan?.durationDays ?? '-'} hari</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('border text-xs font-semibold', PAYMENT_STATUS_STYLES[invoice.status])}>
                        {PAYMENT_STATUS_LABELS[invoice.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs text-muted-foreground">
                        <span>{formatDate(invoice.createdAt)}</span>
                        {invoice.paidAt && <span>Dibayar {formatDate(invoice.paidAt)}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {PAYMENT_ACTIONABLE_STATUSES.includes(invoice.status) ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/subscription/payment?invoiceId=${invoice.id}`}>
                            Lanjutkan
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/subscription/payment?invoiceId=${invoice.id}`}>
                            Detail
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            Menampilkan {firstItem}-{lastItem} dari {total} invoice
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(page - 1, 1))}
              disabled={!canPrev || query.isLoading}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={!canNext || query.isLoading}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, idx) => (
          <Skeleton key={idx} className="h-40 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-32 rounded-3xl" />
      <Skeleton className="h-72 rounded-3xl" />
    </div>
  );
}
