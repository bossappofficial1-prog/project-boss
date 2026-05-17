'use client';

import KpiCards from '@/components/outlet/KpiCards';
import PaymentStatusChart from '@/components/outlet/charts/PaymentStatusChart';
import OrderStatusChart from '@/components/outlet/charts/OrderStatusChart';
import TopProductsChart from '@/components/outlet/charts/TopProductsChart';
import PaymentMethodChart from '@/components/outlet/charts/PaymentMethodChart';
import ProductTypeChart from '@/components/outlet/charts/ProductTypeChart';
import ExpenseVsRevenueChart from '@/components/outlet/charts/ExpenseVsRevenueChart';
import RevenueChart from '@/components/outlet/charts/RevenueChartV2';
import { ArrowDownRight, CheckCircle2, Layers, MapPin, Phone } from 'lucide-react';
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

  if (!selectedOutlet?.id) return <EmptyOutletState onAddOutlet={() => router.push('/owner#add-outlet')} />;
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
      <Card className="rounded-md gap-0 py-0 overflow-hidden border-border/60 shadow-md bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/40 bg-muted/30 p-6">
          <div className="space-y-1.5">
            <CardTitle className="text-2xl font-bold tracking-tight">Analytics Outlet</CardTitle>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Badge variant="outline" className="bg-background/50 font-semibold px-2 py-0.5 rounded-sm border-primary/20 text-primary">
                {selectedOutlet?.name ?? 'Outlet belum dipilih'}
              </Badge>
              <span className="text-xs">•</span>
              <span className="text-xs font-medium">Laporan Performa Real-time</span>
            </div>
          </div>
          {dashboardData?.payments && (
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-[10px] font-bold text-muted-foreground mb-1">Success Rate</p>
              <Badge variant="outline" className="rounded-md px-3 py-1.5 text-sm font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                {dashboardData.payments.successRate}%
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-3">
          <div className="space-y-2 group">
            <p className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Alamat Outlet
            </p>
            <p className="text-sm font-semibold leading-relaxed">
              {selectedOutlet?.address ?? 'Belum tersedia'}
            </p>
          </div>
          <div className="space-y-2 group">
            <p className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
              <Phone className="h-3.5 w-3.5 text-primary" /> Kontak Bisnis
            </p>
            <p className="text-sm font-semibold">
              {selectedOutlet?.phone ?? 'Belum tersedia'}
            </p>
          </div>
          <div className="space-y-2 group">
            <p className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
              Pesanan Hari Ini
            </p>
            <p className="text-2xl font-black tracking-tighter text-foreground">
              {dashboardData?.orders?.todayOrders?.toLocaleString('id-ID') ?? '0'}
              <span className="ml-1.5 text-xs font-medium text-muted-foreground uppercase tracking-normal italic">Pesanan</span>
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
              data={dashboardData.payments.byStatus.map((item) => ({
                name: item.status,
                count: item.count,
                amount: (item as any).amount || 0,
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
              data={dashboardData.orders.byStatus.map(item => ({
                name: item.status,
                count: item.count,
                amount: 0 // Order status data might not have amount, setting to 0
              }))}
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

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {lowStockProducts.length ? (
            <Card className="rounded-md gap-0 pt-0 border-border/60 shadow-sm overflow-hidden bg-gradient-to-b from-background to-amber-500/5 h-full">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-amber-500/5 p-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600">
                    <Layers className="h-4 w-4" />
                  </div>
                  Restok Segera
                </CardTitle>
                <Badge variant="outline" className="rounded-md px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-700 border-amber-200 uppercase">
                  {lowStockProducts.length} Item Kritis
                </Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {lowStockProducts.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:border-amber-200 hover:bg-amber-50/50 transition-all group">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold group-hover:text-amber-700 transition-colors">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Minimal Restok: {item.reorderLevel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-amber-600 italic">Sisa {item.currentStock}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-md border-dashed flex items-center justify-center p-12 bg-muted/5 h-full">
              <div className="text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto opacity-50" />
                <CardDescription>Semua stok produk dalam kondisi aman.</CardDescription>
              </div>
            </Card>
          )}

          {dashboardData?.payments ? (
            <Card className="rounded-md gap-0 pt-0 border-border/60 shadow-sm overflow-hidden bg-gradient-to-b from-background to-primary/5 h-full">
              <CardHeader className="border-b border-border/40 bg-muted/20 p-4">
                <CardTitle className="text-lg font-bold">Insight & Manual Payment</CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border/50 bg-background/50 space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground">Metode Terpopuler</p>
                  <p className="text-lg font-bold text-primary truncate">
                    {topPaymentMethod?.method ?? 'Belum tersedia'}
                  </p>
                  {topPaymentMethod && (
                    <p className="text-[10px] font-medium text-muted-foreground italic">
                      {topPaymentMethod.count} Transaksi • {formatCurrency(topPaymentMethod.amount)}
                    </p>
                  )}
                </div>
                <div className="p-4 rounded-xl border border-border/50 bg-background/50 space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground">Rasio Sukses</p>
                  <p className="text-2xl font-black text-emerald-600">
                    {dashboardData.payments.successRate}%
                  </p>
                  <p className="text-[10px] font-medium text-muted-foreground italic">
                    {dashboardData.payments.successCount} Berhasil • {dashboardData.payments.failedCount} Gagal
                  </p>
                </div>
              </CardContent>

              {dashboardData.payments.manualPayments && (
                <CardContent className="px-4 pb-4">
                  <div className="p-4 rounded-xl border border-amber-200/50 bg-amber-500/5 space-y-4">
                    <div className="flex items-center justify-between border-b border-amber-200/30 pb-2">
                      <p className="text-xs font-bold text-amber-800">Verifikasi Manual</p>
                      <Badge variant="outline" className="bg-amber-500 text-white border-none text-[10px] font-black h-5">PENDING: {dashboardData.payments.manualPayments.pending}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-amber-700/60 uppercase">Diverifikasi</span>
                        <span className="text-sm font-bold">{dashboardData.payments.manualPayments.verified}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-amber-700/60 uppercase">Ditolak</span>
                        <span className="text-sm font-bold">{dashboardData.payments.manualPayments.rejected}</span>
                      </div>
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

        <Card className="rounded-md gap-0 py-0 border-border/60 shadow-md overflow-hidden bg-gradient-to-b from-background to-red-500/5">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-muted/20 p-4">
            <div className="space-y-0.5">
              <CardTitle className="text-lg font-bold">Pengeluaran Terbaru</CardTitle>
              <CardDescription className="text-xs">{recentExpenses.length} transaksi terakhir</CardDescription>
            </div>
            <Badge variant="outline" className="rounded-md bg-red-500/10 border-red-200 text-red-700 px-3 py-1.5 text-xs font-bold uppercase tracking-tight">
              Total Hari Ini: {formatCurrency(dashboardData?.expenses?.todayExpenses || 0)}
            </Badge>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {recentExpenses.length ? recentExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/30 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-red-500/10 text-red-600 group-hover:scale-110 transition-transform">
                    <ArrowDownRight className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-none">{expense.description}</p>
                    <p className="mt-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      {new Date(expense.date).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-base font-black text-red-600 tabular-nums">
                  -{formatCurrency(expense.amount)}
                </p>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center p-12 text-center space-y-2 opacity-50">
                <CardDescription>Belum ada pengeluaran yang tercatat.</CardDescription>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
