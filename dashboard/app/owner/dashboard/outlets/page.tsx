'use client';

import { useMemo } from 'react';
import KpiCards from '@/components/outlet/KpiCards';
import RevenueChartV2 from '@/components/outlet/charts/RevenueChartV2';
import PaymentStatusChart from '@/components/outlet/charts/PaymentStatusChart';
import OrderStatusChart from '@/components/outlet/charts/OrderStatusChart';
import TopProductsChart from '@/components/outlet/charts/TopProductsChart';
import PaymentMethodChart from '@/components/outlet/charts/PaymentMethodChart';
import ProductTypeChart from '@/components/outlet/charts/ProductTypeChart';
import BookingOccupancyChart from '@/components/outlet/charts/BookingOccupancyChart';
import StaffUtilizationChart from '@/components/outlet/charts/StaffUtilizationChart';
import ExpenseVsRevenueChart from '@/components/outlet/charts/ExpenseVsRevenueChart';
import { mockOutletDashboard } from '@/lib/mock-data/outlet-dashboard';
import { DollarSign, ShoppingCart, TrendingUp, AlertCircle } from 'lucide-react';

export default function OutletsDashboard() {
  const dashboardData = mockOutletDashboard;

  // Prepare KPI data
  const kpiCards = useMemo(() => {
    return [
      {
        title: 'Total Pendapatan (Bulan Ini)',
        value: `Rp ${dashboardData.revenue.monthRevenue.toLocaleString('id-ID')}`,
        icon: (
          <DollarSign className="w-6 h-6" />
        ),
        trend: 12,
        trendLabel: 'Naik 12% dari bulan lalu',
        bgGradient: 'from-green-500 to-emerald-500',
        accentColor: 'text-green-600 dark:text-green-400',
        comparison: {
          label: 'Hari ini',
          value: `Rp ${dashboardData.revenue.todayRevenue.toLocaleString('id-ID')}`,
        },
      },
      {
        title: 'Total Pesanan (Bulan Ini)',
        value: dashboardData.orders.totalOrders.toLocaleString('id-ID'),
        icon: (
          <ShoppingCart className="w-6 h-6" />
        ),
        trend: 8,
        trendLabel: 'Naik 8% dari bulan lalu',
        bgGradient: 'from-blue-500 to-cyan-500',
        accentColor: 'text-blue-600 dark:text-blue-400',
        comparison: {
          label: 'Hari ini',
          value: dashboardData.orders.todayOrders.toString(),
        },
      },
      {
        title: 'Nilai Order Rata-rata',
        value: `Rp ${dashboardData.orders.averageOrderValue.toLocaleString('id-ID')}`,
        icon: (
          <TrendingUp className="w-6 h-6" />
        ),
        trend: 3,
        trendLabel: 'Stabil dibanding periode lalu',
        bgGradient: 'from-purple-500 to-pink-500',
        accentColor: 'text-purple-600 dark:text-purple-400',
        comparison: {
          label: 'Total Produk Aktif',
          value: dashboardData.products.activeProducts.toString(),
        },
      },
      {
        title: 'Produk dengan Stok Rendah',
        value: dashboardData.products.lowStockProducts.length.toString(),
        icon: (
          <AlertCircle className="w-6 h-6" />
        ),
        trend: -5,
        trendLabel: 'Perlu diperhatian',
        bgGradient: 'from-orange-500 to-red-500',
        accentColor: 'text-orange-600 dark:text-orange-400',
        comparison: {
          label: 'Segera pesan ulang',
          value: `${Math.floor(dashboardData.products.lowStockProducts.length * 0.7)} items`,
        },
      },
    ];
  }, []);

  return (
    <div className="pb-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          Analytics Outlet
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {dashboardData.outletInfo.name}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8">
        <KpiCards kpis={kpiCards} />
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Revenue Chart - Full Width */}
        <RevenueChartV2 data={dashboardData.revenue.dailyTrend} />

        {/* Payment & Order Status Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaymentStatusChart
            data={dashboardData.payments.byStatus.map((s) => ({
              ...s,
              percentage: Math.round((s.count / dashboardData.payments.totalTransactions) * 100),
            }))}
            successRate={dashboardData.payments.successRate}
          />

          <OrderStatusChart
            data={dashboardData.orders.byStatus}
            completionRate={dashboardData.orders.completionRate}
          />
        </div>

        {/* Top Products - Full Width */}
        <TopProductsChart data={dashboardData.products.topProducts} />

        {/* Payment Method & Product Type Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaymentMethodChart data={dashboardData.payments.byPaymentMethod} />
          <ProductTypeChart
            data={dashboardData.products.byType.map((item) => ({
              ...item,
              activeCount: item.type === 'GOODS' ? 42 : 18,
            }))}
          />
        </div>

        {/* Expense vs Revenue - Full Width */}
        <ExpenseVsRevenueChart
          data={[
            { date: '2025-10-24', revenue: 2500000, expenses: 600000 },
            { date: '2025-10-25', revenue: 3000000, expenses: 720000 },
            { date: '2025-10-26', revenue: 2800000, expenses: 680000 },
            { date: '2025-10-27', revenue: 3500000, expenses: 840000 },
            { date: '2025-10-28', revenue: 3200000, expenses: 800000 },
            { date: '2025-10-29', revenue: 4000000, expenses: 960000 },
            { date: '2025-10-30', revenue: 3750000, expenses: 900000 },
          ]}
          summary={dashboardData.expenses.expenseVsRevenue}
        />

        {/* Recent Expenses */}
        <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Pengeluaran Terbaru
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {dashboardData.expenses.recentExpenses.length} transaksi terakhir
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {dashboardData.expenses.recentExpenses.map((expense, index) => (
              <div
                key={expense.id}
                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:bg-white/10 dark:hover:bg-gray-700/30 ${index % 2 === 0
                  ? 'bg-white/5 dark:bg-gray-700/20'
                  : 'bg-white/0 dark:bg-gray-800/0'
                  }`}
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {expense.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {new Date(expense.date).toLocaleDateString('id-ID', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <p className="text-lg font-bold text-red-600 dark:text-red-400 ml-4">
                  -Rp {expense.amount.toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
