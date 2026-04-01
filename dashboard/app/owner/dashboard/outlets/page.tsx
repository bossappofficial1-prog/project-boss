'use client';

import KpiCards from '@/components/outlet/KpiCards';
import PaymentStatusChart from '@/components/outlet/charts/PaymentStatusChart';
import OrderStatusChart from '@/components/outlet/charts/OrderStatusChart';
import TopProductsChart from '@/components/outlet/charts/TopProductsChart';
import PaymentMethodChart from '@/components/outlet/charts/PaymentMethodChart';
import ProductTypeChart from '@/components/outlet/charts/ProductTypeChart';
import ExpenseVsRevenueChart from '@/components/outlet/charts/ExpenseVsRevenueChart';
import RevenueChart from '@/components/outlet/charts/RevenueChartV2';
import { MapPin, Phone } from 'lucide-react';
import { useOutletContext } from '@/components/providers/OutletProvider';
import { useOutletAnalytics } from '@/hooks/useOutletAnalytics';
import { useRouter } from 'next/navigation';
import { EmptyOutletState } from '@/components/ui/empty-outlet';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function OutletsDashboard() {
  const { selectedOutlet } = useOutletContext();
  const { data: dashboardData, kpiCards, isPending, topProductsData, lowStockProducts, productTypeData, topPaymentMethod } = useOutletAnalytics(selectedOutlet?.id);
  const router = useRouter();

  if (!selectedOutlet?.id) return <EmptyOutletState onAddOutlet={() => router.push('/owner/dashboard#add-outlet')} />;
  if (isPending) {
    return (
      <Card className="rounded-md py-5">
        <CardContent className="text-sm text-muted-foreground">Memuat analitik outlet…</CardContent>
      </Card>
    );
  }

  const recentExpenses = dashboardData?.expenses?.recentExpenses ?? [];

  return (
    <div className="space-y-3 pb-6">
      <Card className="rounded-md py-5">
        <CardHeader className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-2xl font-bold">Analytics Outlet</CardTitle>
            <CardDescription className="mt-1 text-sm">
              {selectedOutlet?.name ?? 'Outlet belum dipilih'}
            </CardDescription>
          </div>
          {dashboardData?.payments && (
            <Badge variant="secondary" className="rounded-md px-3 py-2 text-sm font-normal">
              <span className="font-semibold text-foreground">Transaksi sukses:</span>{' '}
              {dashboardData.payments.successRate}%
            </Badge>
          )}
        </CardHeader>

        <CardContent className="mt-3 grid grid-cols-1 gap-3 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500">
              <MapPin className="h-3.5 w-3.5" /> Alamat
            </p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              {selectedOutlet?.address ?? 'Belum tersedia'}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500">
              <Phone className="h-3.5 w-3.5" /> Kontak
            </p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              {selectedOutlet?.phone ?? 'Belum tersedia'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500">Pesanan hari ini</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              {dashboardData?.orders?.todayOrders?.toLocaleString('id-ID') ?? '-'} pesanan
            </p>
          </div>
        </CardContent>
      </Card>

      <section>
        <KpiCards kpis={kpiCards} />
      </section>

      {selectedOutlet?.id && (
        <section>
          <RevenueChart outletId={selectedOutlet.id} />
        </section>
      )}

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
            <Card className="rounded-md border-dashed py-5">
              <CardContent className="text-sm text-gray-500 dark:text-gray-400">Data pembayaran belum tersedia</CardContent>
            </Card>
          )}

          {dashboardData?.orders ? (
            <OrderStatusChart
              data={dashboardData.orders.byStatus}
              completionRate={dashboardData.orders.completionRate}
            />
          ) : (
            <Card className="rounded-md border-dashed py-5">
              <CardContent className="text-sm text-gray-500 dark:text-gray-400">Data status pesanan belum tersedia</CardContent>
            </Card>
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
            <Card className="rounded-md py-5">
              <CardHeader className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg font-semibold">Produk Perlu Restok</CardTitle>
                <Badge variant="warning" className="rounded-md px-2.5 py-1 text-xs font-semibold">
                  {lowStockProducts.length} item
                </Badge>
              </CardHeader>
              <CardContent className="mt-3 space-y-3">
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
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-md py-5">
              <CardContent className="text-sm text-gray-600 dark:text-gray-400">Stok aman, tidak ada produk di bawah batas minimum.</CardContent>
            </Card>
          )}

          {dashboardData?.payments ? (
            <Card className="rounded-md py-5">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Insight Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
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
              </CardContent>

              {dashboardData.payments.manualPayments && (
                <CardContent className="mt-3">
                  <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
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
                </CardContent>
              )}
            </Card>
          ) : null}
        </div>

        {dashboardData?.expenseVsRevenueData && dashboardData?.expenses && (
          <ExpenseVsRevenueChart
            data={dashboardData.expenseVsRevenueData}
            summary={dashboardData.expenses.expenseVsRevenue}
          />
        )}

        <Card className="rounded-md py-5">
          <CardHeader className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold">Pengeluaran Terbaru</CardTitle>
              <CardDescription className="text-sm">
                {recentExpenses.length} transaksi terakhir
              </CardDescription>
            </div>
            <Badge variant="secondary" className="rounded-md bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Total: {formatCurrency(dashboardData?.expenses?.todayExpenses || 0)} hari ini
            </Badge>
          </CardHeader>

          <CardContent className="mt-3 space-y-3">
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
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
