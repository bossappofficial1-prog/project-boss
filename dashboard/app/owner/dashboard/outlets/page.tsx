'use client';

import { useMemo, type ReactNode } from 'react';
import KpiCards from '@/components/outlet/KpiCards';
import PaymentStatusChart from '@/components/outlet/charts/PaymentStatusChart';
import OrderStatusChart from '@/components/outlet/charts/OrderStatusChart';
import TopProductsChart from '@/components/outlet/charts/TopProductsChart';
import PaymentMethodChart from '@/components/outlet/charts/PaymentMethodChart';
import ProductTypeChart from '@/components/outlet/charts/ProductTypeChart';
import ExpenseVsRevenueChart from '@/components/outlet/charts/ExpenseVsRevenueChart';
import { DollarSign, AlertCircle, ShoppingCart, TrendingUp, CreditCard, MapPin, Phone } from 'lucide-react';
import { useOutletContext } from '@/components/providers/OutletProvider';
import { useOutletAnalytics } from '@/hooks/useOutletAnalytics';
import type { TopProduct, ByType } from '@/types';

export default function OutletsDashboard() {
  const { selectedOutlet, isLoading } = useOutletContext();
  const { data: dashboardData, isPending } = useOutletAnalytics(selectedOutlet?.id);

  const formatCurrency = (value?: number | null) => {
    if (typeof value !== 'number') return '-';
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  const topProductsData = useMemo<TopProduct[]>(() => {
    if (!dashboardData?.products?.topProducts) return [];
    return dashboardData.products.topProducts.map((product) => ({
      id: product.id,
      name: product.name,
      sales: product.quantity,
      quantity: product.quantity,
      revenue: product.revenue,
      type: product.type,
    }));
  }, [dashboardData?.products?.topProducts]);

  const productTypeData = useMemo<ByType[]>(() => {
    if (!dashboardData?.products?.byType) return [];
    return dashboardData.products.byType.map((item) => ({
      type: item.type,
      count: item.count,
      percentage: item.percentage,
    }));
  }, [dashboardData?.products?.byType]);

  const lowStockProducts = useMemo(
    () => (dashboardData?.products?.lowStock ?? []).slice(0, 5),
    [dashboardData?.products?.lowStock],
  );

  const topPaymentMethod = useMemo(() => {
    if (!dashboardData?.payments?.byPaymentMethod?.length) return undefined;
    return [...dashboardData.payments.byPaymentMethod].sort((a, b) => b.count - a.count)[0];
  }, [dashboardData?.payments?.byPaymentMethod]);

  const kpiCards = useMemo(() => {
    if (!dashboardData) return [];

    const cards: Array<{
      title: string;
      value: string;
      icon: ReactNode;
      accentColor: string;
      accentBackground?: string;
      description?: string;
      comparison?: Array<{ label: string; value: string }>;
    }> = [];

    const { revenue } = dashboardData;
    const revenueGrowthRaw = revenue.monthOverMonthGrowth;
    let revenueDescription = 'Belum ada data perbandingan';
    if (typeof revenueGrowthRaw === 'number') {
      const rounded = Math.round(revenueGrowthRaw);
      revenueDescription = rounded === 0
        ? 'Stabil dibanding bulan lalu'
        : `${rounded > 0 ? 'Naik' : 'Turun'} ${Math.abs(rounded)}% dibanding bulan lalu`;
    }

    cards.push({
      title: 'Pendapatan Bulan Ini',
      value: formatCurrency(revenue.monthRevenue),
      icon: <DollarSign className="h-5 w-5" />,
      accentColor: 'text-emerald-600 dark:text-emerald-400',
      accentBackground: 'bg-emerald-100/60 dark:bg-emerald-900/30',
      description: revenueDescription,
      comparison: [
        { label: 'Minggu ini', value: formatCurrency(revenue.weekRevenue) },
        { label: 'Hari ini', value: formatCurrency(revenue.todayRevenue) },
      ],
    });

    if (dashboardData.orders) {
      const { monthOrders, weekOrders, todayOrders, averageOrderValue } = dashboardData.orders;
      const expectedWeekly = monthOrders > 0 ? monthOrders / 4 : 0;
      let ordersDescription = 'Belum ada data perbandingan';
      if (expectedWeekly > 0) {
        const diff = Math.round(((weekOrders - expectedWeekly) / expectedWeekly) * 100);
        ordersDescription = diff === 0
          ? 'Sesuai rata-rata mingguan'
          : `${diff > 0 ? 'Di atas' : 'Di bawah'} rata-rata mingguan ${Math.abs(diff)}%`;
      }

      cards.push({
        title: 'Pesanan Bulan Ini',
        value: monthOrders.toLocaleString('id-ID'),
        icon: <ShoppingCart className="h-5 w-5" />,
        accentColor: 'text-blue-600 dark:text-blue-400',
        accentBackground: 'bg-blue-100/60 dark:bg-blue-900/30',
        description: ordersDescription,
        comparison: [
          { label: 'Minggu ini', value: weekOrders.toLocaleString('id-ID') },
          { label: 'Hari ini', value: todayOrders.toLocaleString('id-ID') },
        ],
      });

      const todayAverageOrderValue = todayOrders > 0
        ? Math.round(revenue.todayRevenue / todayOrders)
        : null;

      let averageDescription = 'Belum ada pesanan hari ini';
      if (todayAverageOrderValue !== null) {
        if (averageOrderValue > 0) {
          const diff = Math.round(((todayAverageOrderValue - averageOrderValue) / averageOrderValue) * 100);
          averageDescription = diff === 0
            ? `Rata-rata hari ini ${formatCurrency(todayAverageOrderValue)}`
            : `${diff > 0 ? 'Di atas' : 'Di bawah'} rata-rata bulanan ${Math.abs(diff)}%`;
        } else {
          averageDescription = `Rata-rata hari ini ${formatCurrency(todayAverageOrderValue)}`;
        }
      }

      cards.push({
        title: 'Nilai Order Rata-rata',
        value: formatCurrency(averageOrderValue),
        icon: <TrendingUp className="h-5 w-5" />,
        accentColor: 'text-purple-600 dark:text-purple-400',
        accentBackground: 'bg-purple-100/60 dark:bg-purple-900/30',
        description: averageDescription,
        comparison: [
          { label: 'Rata-rata hari ini', value: todayAverageOrderValue !== null ? formatCurrency(todayAverageOrderValue) : '-' },
          { label: 'Pesanan bulan ini', value: monthOrders.toLocaleString('id-ID') },
        ],
      });

      const lowStockCount = dashboardData.products?.lowStock?.length ?? 0;
      if (lowStockCount > 0) {
        const totalProductsCount = productTypeData.reduce((sum, item) => sum + item.count, 0);
        const lowStockPercentage = totalProductsCount > 0
          ? Math.round((lowStockCount / totalProductsCount) * 100)
          : undefined;

        cards.push({
          title: 'Produk Perlu Restok',
          value: lowStockCount.toLocaleString('id-ID'),
          icon: <AlertCircle className="h-5 w-5" />,
          accentColor: 'text-amber-600 dark:text-amber-400',
          accentBackground: 'bg-amber-100/60 dark:bg-amber-900/30',
          description: lowStockPercentage
            ? `${lowStockPercentage}% dari katalog di bawah batas minimum`
            : 'Periksa stok untuk menjaga ketersediaan',
          comparison: lowStockProducts.slice(0, 2).map((item) => ({
            label: item.name,
            value: `Sisa ${item.currentStock}`,
          })),
        });
      }
    }

    const manualPayments = dashboardData.payments?.manualPayments;
    if (manualPayments) {
      cards.push({
        title: 'Pembayaran Manual',
        value: manualPayments.totalManual.toLocaleString('id-ID'),
        icon: <CreditCard className="h-5 w-5" />,
        accentColor: 'text-amber-700 dark:text-amber-400',
        accentBackground: 'bg-amber-100/60 dark:bg-amber-900/30',
        description: manualPayments.pending
          ? `${manualPayments.pending} menunggu verifikasi`
          : 'Tidak ada pembayaran manual yang pending',
        comparison: [
          { label: 'Diverifikasi', value: manualPayments.verified.toLocaleString('id-ID') },
          { label: 'Ditolak', value: manualPayments.rejected.toLocaleString('id-ID') },
        ],
      });
    }

    return cards;
  }, [dashboardData, productTypeData, lowStockProducts]);

  if (isLoading || isPending) {
    return <p className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">Memuat analitik outlet…</p>;
  }

  const recentExpenses = dashboardData?.expenses?.recentExpenses ?? [];

  return (
    <div className="space-y-3 pb-6">
      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Outlet</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {selectedOutlet?.name ?? 'Outlet belum dipilih'}
            </p>
          </div>
          {dashboardData?.payments && (
            <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-gray-900/40 dark:text-gray-200">
              <span className="font-semibold text-gray-900 dark:text-white">Transaksi sukses:</span>{' '}
              {dashboardData.payments.successRate}%
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-3">
          <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-900/40">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500">
              <MapPin className="h-3.5 w-3.5" /> Alamat
            </p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              {selectedOutlet?.address ?? 'Belum tersedia'}
            </p>
          </div>
          <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-900/40">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500">
              <Phone className="h-3.5 w-3.5" /> Kontak
            </p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              {selectedOutlet?.phone ?? 'Belum tersedia'}
            </p>
          </div>
          <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-900/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500">Pesanan hari ini</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              {dashboardData?.orders?.todayOrders?.toLocaleString('id-ID') ?? '-'} pesanan
            </p>
          </div>
        </div>
      </section>

      <section>
        <KpiCards kpis={kpiCards} />
      </section>

      <section className="space-y-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {dashboardData?.payments ? (
            <PaymentStatusChart
              data={dashboardData.payments.byStatus.map((status) => ({
                ...status,
                percentage: dashboardData.payments.totalTransactions
                  ? Math.round((status.count / dashboardData.payments.totalTransactions) * 100)
                  : 0,
              }))}
              successRate={dashboardData.payments.successRate}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 p-5 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
              Data pembayaran belum tersedia
            </div>
          )}

          {dashboardData?.orders ? (
            <OrderStatusChart
              data={dashboardData.orders.byStatus}
              completionRate={dashboardData.orders.completionRate}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 p-5 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
              Data status pesanan belum tersedia
            </div>
          )}
        </div>

        {topProductsData.length > 0 && (
          <TopProductsChart data={topProductsData} />
        )}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {dashboardData?.payments && (
            <PaymentMethodChart data={dashboardData.payments.byPaymentMethod} />
          )}
          {productTypeData.length > 0 && (
            <ProductTypeChart data={productTypeData} />
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {lowStockProducts.length ? (
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Produk Perlu Restok</h3>
                <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {lowStockProducts.length} item
                </span>
              </div>
              <div className="mt-3 space-y-3">
                {lowStockProducts.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-100 px-3 py-3 text-sm transition hover:border-amber-200 hover:bg-amber-50/40 dark:border-gray-800 dark:hover:border-amber-700/40 dark:hover:bg-amber-900/15">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        Sisa {item.currentStock}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Minimal {item.reorderLevel} · Segera restok</p>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
              Stok aman, tidak ada produk di bawah batas minimum.
            </section>
          )}

          {dashboardData?.payments ? (
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Insight Pembayaran</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-gray-100 px-3 py-3 dark:border-gray-800">
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-500">Metode Terpopuler</p>
                  <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                    {topPaymentMethod?.method ?? 'Belum tersedia'}
                  </p>
                  {topPaymentMethod && (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {topPaymentMethod.count} transaksi · {formatCurrency(topPaymentMethod.amount)}
                    </p>
                  )}
                </div>
                <div className="rounded-lg border border-gray-100 px-3 py-3 dark:border-gray-800">
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-500">Rasio Keberhasilan</p>
                  <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                    {dashboardData.payments.successRate}%
                  </p>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    {dashboardData.payments.successCount.toLocaleString('id-ID')} berhasil · {dashboardData.payments.failedCount.toLocaleString('id-ID')} gagal
                  </p>
                </div>
              </div>

              {dashboardData.payments.manualPayments && (
                <div className="mt-3 space-y-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Pembayaran Manual</p>
                  <div className="flex items-center justify-between">
                    <span>Pending</span>
                    <span className="font-semibold">{dashboardData.payments.manualPayments.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Diverifikasi</span>
                    <span className="font-semibold">{dashboardData.payments.manualPayments.verified}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ditolak</span>
                    <span className="font-semibold">{dashboardData.payments.manualPayments.rejected}</span>
                  </div>
                </div>
              )}
            </section>
          ) : null}
        </div>

        {dashboardData?.expenseVsRevenueData && dashboardData?.expenses && (
          <ExpenseVsRevenueChart
            data={dashboardData.expenseVsRevenueData}
            summary={dashboardData.expenses.expenseVsRevenue}
          />
        )}

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pengeluaran Terbaru</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {recentExpenses.length} transaksi terakhir
              </p>
            </div>
            <div className="rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Total: {formatCurrency(dashboardData?.expenses?.todayExpenses)} hari ini
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {recentExpenses.length ? recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 px-3 py-3 text-sm transition hover:border-blue-200 hover:bg-blue-50/40 dark:border-gray-800 dark:hover:border-blue-800/40 dark:hover:bg-blue-900/20"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{expense.description}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(expense.date).toLocaleDateString('id-ID', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <p className="text-sm font-bold text-red-600 dark:text-red-400">
                  -{formatCurrency(expense.amount)}
                </p>
              </div>
            )) : (
              <p className="rounded-lg border border-dashed border-gray-200 p-3 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Belum ada pengeluaran yang tercatat.
              </p>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
