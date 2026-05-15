"use client";

import { useState } from "react";
import {
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { formatCurrency, formatNumberCompactID } from "@/lib/utils";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { useTools } from "@/hooks/use-tools";
import { useStoreState } from "@/stores/use-state";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { InsightCard } from "@/components/pages/business-health/insight-card";
import { BusinessHealthSkeleton } from "@/components/pages/business-health/skeleton";
import { BusinessHealthEmpty } from "@/components/pages/business-health/empty";
import { GRADE_CONFIG } from "@/components/pages/business-health/utils";
import { StatusBadge } from "@/components/pages/business-health/status-badge";
import { ScoreBar } from "@/components/pages/business-health/score-bar";
import { MetricCard } from "@/components/pages/business-health/metric-card";
import { MetricRow } from "@/components/pages/business-health/metric-row";
import { GrowthChip } from "@/components/pages/business-health/growth-chip";

export default function BusinessHealth() {
  const { selectedOutletId } = useOutletContext();
  const { dateRange: dateRangeValue } = useStoreState();

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    dateRangeValue || {
      from: addDays(new Date(), -30),
      to: new Date(),
    },
  );

  const { businessHealth } = useTools("businessHealth", selectedOutletId!, {
    from: dateRange?.from!,
    to: dateRange?.to!,
  });

  if (businessHealth.isPending) return <BusinessHealthSkeleton />;

  const data = businessHealth.data;

  if (!data) return <BusinessHealthEmpty />;

  const gradeCfg = GRADE_CONFIG[data.grade];
  const {
    revenue,
    grossProfit,
    netProfit,
    expenseControl,
    productPerformance,
  } = data.metrics;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Kesehatan Bisnis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Skor menyeluruh kondisi outlet berdasarkan data transaksi &
            pengeluaran
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Overall Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score */}
        <Card className="shadow-none py-0 gap-0 border-border/50 md:col-span-1">
          <CardContent className="p-6 flex flex-col items-center justify-center gap-3 h-full">
            <div
              className={`h-24 w-24 rounded-full ${gradeCfg.bg} flex flex-col items-center justify-center`}
            >
              <span className={`text-4xl font-bold ${gradeCfg.color}`}>
                {data.grade}
              </span>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold tabular-nums">
                {data.overallScore}
                <span className="text-sm font-normal text-muted-foreground">
                  /100
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {gradeCfg.desc}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <Card className="shadow-none py-0 gap-0 border-border/50 md:col-span-2">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Breakdown Skor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            {[
              {
                label: "Revenue & Pertumbuhan",
                score: revenue.score,
                status: revenue.status,
                weight: "25%",
              },
              {
                label: "Gross Profit",
                score: grossProfit.score,
                status: grossProfit.status,
                weight: "25%",
              },
              {
                label: "Net Profit",
                score: netProfit.score,
                status: netProfit.status,
                weight: "25%",
              },
              {
                label: "Kendali Pengeluaran",
                score: expenseControl.score,
                status: expenseControl.status,
                weight: "15%",
              },
              {
                label: "Performa Produk",
                score: productPerformance.score,
                status: productPerformance.status,
                weight: "10%",
              },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      bobot {item.weight}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
                <ScoreBar score={item.score} status={item.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Revenue */}
        <MetricCard
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
          title="Revenue"
          score={revenue.score}
          status={revenue.status}
        >
          <MetricRow
            label="Omzet periode ini"
            value={
              <span className="flex items-center gap-1">
                {formatCurrency(revenue.current)}{" "}
                <GrowthChip value={revenue.growthRate} />
              </span>
            }
            sub={`periode lalu ${formatCurrency(revenue.previous)}`}
          />
          <MetricRow
            label="Total transaksi"
            value={`${revenue.totalOrders.toLocaleString("id-ID")} order`}
          />
          <MetricRow
            label="Rata-rata transaksi"
            value={formatCurrency(revenue.avgTransactionValue)}
          />
        </MetricCard>

        {/* Gross Profit */}
        <MetricCard
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          title="Gross Profit"
          score={grossProfit.score}
          status={grossProfit.status}
        >
          <MetricRow
            label="Total omzet"
            value={formatCurrency(grossProfit.totalRevenue)}
          />
          <MetricRow
            label="Total HPP"
            value={
              <span className="text-muted-foreground">
                {formatCurrency(grossProfit.totalHpp)}
              </span>
            }
          />
          <Separator />
          <MetricRow
            label="Gross profit"
            value={formatCurrency(grossProfit.grossProfit)}
            sub={`Gross margin ${grossProfit.grossMargin.toFixed(1)}%`}
          />
        </MetricCard>

        {/* Net Profit */}
        <MetricCard
          icon={<Receipt className="h-4 w-4 text-muted-foreground" />}
          title="Net Profit"
          score={netProfit.score}
          status={netProfit.status}
        >
          <MetricRow
            label="Gross profit"
            value={formatCurrency(netProfit.grossProfit)}
          />
          <MetricRow
            label="Total pengeluaran"
            value={
              <span className="text-muted-foreground">
                - {formatCurrency(netProfit.totalExpenses)}
              </span>
            }
          />
          <Separator />
          <MetricRow
            label="Net profit"
            value={
              <span
                className={
                  netProfit.netProfit >= 0 ? "text-foreground" : "text-red-600"
                }
              >
                {formatCurrency(netProfit.netProfit)}
              </span>
            }
            sub={`Net margin ${netProfit.netMargin.toFixed(1)}%`}
          />
        </MetricCard>

        {/* Expense Control */}
        <MetricCard
          icon={<TrendingDown className="h-4 w-4 text-muted-foreground" />}
          title="Kendali Pengeluaran"
          score={expenseControl.score}
          status={expenseControl.status}
        >
          <MetricRow
            label="Total pengeluaran"
            value={formatCurrency(expenseControl.totalExpenses)}
            sub={`${expenseControl.expenseRatio.toFixed(1)}% dari omzet`}
          />
          <Separator />
          <p className="text-xs text-muted-foreground">Pengeluaran terbesar:</p>
          {expenseControl.topExpenses.map((e, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate pr-2">
                {e.description}
              </span>
              <span className="tabular-nums font-medium shrink-0">
                {formatNumberCompactID(e.amount)}
              </span>
            </div>
          ))}
        </MetricCard>

        {/* Product Performance */}
        <MetricCard
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
          title="Performa Produk"
          score={productPerformance.score}
          status={productPerformance.status}
        >
          <MetricRow
            label="Produk aktif terjual"
            value={`${productPerformance.activeProducts} / ${productPerformance.totalProducts}`}
            sub={`${((productPerformance.activeProducts / productPerformance.totalProducts) * 100).toFixed(0)}% dari total produk`}
          />
          {productPerformance.topProduct && (
            <MetricRow
              label="Produk terbaik"
              value={productPerformance.topProduct.name}
              sub={`${formatNumberCompactID(productPerformance.topProduct.revenue)} · margin ${productPerformance.topProduct.margin.toFixed(0)}%`}
            />
          )}
          <MetricRow
            label="Produk margin rendah"
            value={
              <span
                className={
                  productPerformance.lowMarginCount > 0
                    ? "text-amber-600"
                    : "text-emerald-600"
                }
              >
                {productPerformance.lowMarginCount} produk
              </span>
            }
            sub="margin < 20%"
          />
        </MetricCard>
      </div>

      {/* Insights */}
      <InsightCard insights={data.insights} />
    </div>
  );
}
