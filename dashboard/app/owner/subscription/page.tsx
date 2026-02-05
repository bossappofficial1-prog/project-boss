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
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/withdrawals';
import { InvoiceHistorySection } from '@/components/features/owner/subscription/InvoiceHistorySection';
import { SubscriptionSkeleton } from '../../../components/features/owner/subscription/SubscriptionSkeleton';
import { SubscriptionDetailSection } from '@/components/features/owner/subscription/SubscriptionDetailSection';
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES } from '@/components/features/owner/subscription/helper';

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
      : (overviewQuery.error as unknown as { message?: string })?.message;

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
        router.push(`/subscription/payment/${result.invoice.id}`);
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
          <h1 className="text-3xl font-semibold text-foreground dark:text-gray-100">Status Langganan Bisnis</h1>
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
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
          <SubscriptionDetailSection
            handleRenew={handleRenew}
            isRenewLoading={renewMutation.isPending}
            data={overviewQuery.data}
          />

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
                  <Card key={card.key} className={cn('border shadow-sm')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-foreground">{card.label}</CardTitle>
                      <div className="rounded-lg bg-white/20 p-2">
                        <Icon className="h-5 w-5 text-red-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold text-foreground">{used ?? 0}</p>
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
              <Card>
                <CardContent className="flex flex-col gap-3 p-6 text-sm text-foreground md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-card-foreground">Tidak ada tagihan tertunda</p>
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
