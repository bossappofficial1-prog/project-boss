"use client";

import { useState } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  ShoppingCart,
  Package,
  Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { Grade, HealthStatus, useTools } from "@/hooks/use-tools";

function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return value.toString();
}

const STATUS_CONFIG: Record<
  HealthStatus,
  { color: string; bg: string; label: string }
> = {
  healthy: {
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    label: "Sehat",
  },
  warning: {
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    label: "Perhatian",
  },
  danger: {
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    label: "Kritis",
  },
};

const GRADE_CONFIG: Record<Grade, { color: string; bg: string; desc: string }> =
  {
    A: {
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      desc: "Bisnis dalam kondisi sangat baik",
    },
    B: {
      color: "text-blue-700",
      bg: "bg-blue-50",
      desc: "Bisnis cukup sehat, ada ruang perbaikan",
    },
    C: {
      color: "text-amber-700",
      bg: "bg-amber-50",
      desc: "Perlu perhatian di beberapa area",
    },
    D: {
      color: "text-red-700",
      bg: "bg-red-50",
      desc: "Segera evaluasi kondisi bisnis",
    },
  };

function StatusBadge({ status }: { status: HealthStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge className={`${cfg.bg} ${cfg.color} border hover:${cfg.bg} text-xs`}>
      {cfg.label}
    </Badge>
  );
}

function ScoreBar({ score, status }: { score: number; status: HealthStatus }) {
  const barColor =
    status === "healthy"
      ? "bg-emerald-500"
      : status === "warning"
        ? "bg-amber-500"
        : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
        {score}
      </span>
    </div>
  );
}

function GrowthChip({ value }: { value: number }) {
  if (value > 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
        <TrendingUp className="h-3 w-3" />+{value.toFixed(1)}%
      </span>
    );
  if (value < 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-red-500">
        <TrendingDown className="h-3 w-3" />
        {value.toFixed(1)}%
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
      <Minus className="h-3 w-3" />
      0%
    </span>
  );
}

function InsightIcon({ type }: { type: "positive" | "warning" | "danger" }) {
  if (type === "positive")
    return <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
  if (type === "warning")
    return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
  return <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />;
}

function MetricCard({
  icon,
  title,
  score,
  status,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  score: number;
  status: HealthStatus;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 py-0 shadow-none border-border/50">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
              {icon}
            </div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <StatusBadge status={status} />
        </div>
        <ScoreBar score={score} status={status} />
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-2">{children}</CardContent>
    </Card>
  );
}

function MetricRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="text-right">
        <div className="font-medium tabular-nums">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

export default function BusinessHealth() {
  const { selectedOutletId } = useOutletContext();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const { businessHealth } = useTools(selectedOutletId!, {
    from: dateRange?.from!,
    to: dateRange?.to!,
  });

  if (businessHealth.isPending) return <p>Loading...</p>;

  const data = businessHealth.data;

  if (!data) return <p>No data found.</p>;

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
        <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
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
                {formatCompact(e.amount)}
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
              sub={`${formatCompact(productPerformance.topProduct.revenue)} · margin ${productPerformance.topProduct.margin.toFixed(0)}%`}
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
      <Card className="py-0 gap-0 shadow-none border-border/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Insight & Rekomendasi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3">
          {data.insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <InsightIcon type={insight.type} />
              <p
                className={
                  insight.type === "positive"
                    ? "text-foreground"
                    : insight.type === "warning"
                      ? "text-amber-800"
                      : "text-red-800"
                }
              >
                {insight.message}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
