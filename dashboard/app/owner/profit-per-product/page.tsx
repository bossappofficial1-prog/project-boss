"use client";

import { useState, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { SummaryCard } from "@/components/features/owner/report/SummaryCard";
import { formatCurrency } from "@/lib/utils";
import { ProductProfitTable } from "@/components/pages/profit-per-product/product-profit-table";
import { HighlightCard } from "@/components/pages/profit-per-product/highlight-card";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { useTools } from "@/hooks/use-tools";

export default function ProfitPerProduct() {
  const { selectedOutletId } = useOutletContext();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const { profitPerProduct } = useTools(selectedOutletId!, {
    from: dateRange?.from!,
    to: dateRange?.to!,
  });

  const data = profitPerProduct.data;

  const topProduct = useMemo(
    () =>
      [...(data?.products ?? [])].sort(
        (a, b) => b.totalProfit - a.totalProfit,
      )[0],
    [data?.products],
  );

  if (!data) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Profit per Produk
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Analisis profitabilitas tiap produk berdasarkan transaksi selesai
            </p>
          </div>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>

        {/* Loading State */}
        <div className="p-6 border rounded-md bg-muted text-center text-sm text-muted-foreground">
          Memuat data profit per produk...
        </div>
      </div>
    );
  }

  const lowMarginCount = data.products.filter(
    (p) => p.marginPercentage < 20,
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Profit per Produk
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analisis profitabilitas tiap produk berdasarkan transaksi selesai
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          title="Total Omzet"
          value={formatCurrency(data.summary.totalRevenue)}
          description={`${data.summary.totalOrders} transaksi`}
        />
        <SummaryCard
          title="Total HPP"
          value={formatCurrency(data.summary.totalHppCost)}
          description={`${data.summary.totalQtySold.toLocaleString("id-ID")} unit terjual`}
        />
        <SummaryCard
          title="Total Profit"
          value={formatCurrency(data.summary.totalProfit)}
          highlight
          description="Gross profit periode ini"
        />
        <SummaryCard
          title="Rata-rata Margin"
          value={`${data.summary.avgMarginPercentage.toFixed(1)}%`}
          description={
            lowMarginCount > 0
              ? `${lowMarginCount} produk margin rendah`
              : "Semua produk sehat"
          }
        />
      </div>

      {/* Highlight Cards */}
      <HighlightCard topProduct={topProduct} lowMarginCount={lowMarginCount} />

      {/* Table */}
      <ProductProfitTable products={data.products} />
    </div>
  );
}
