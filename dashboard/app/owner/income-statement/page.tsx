"use client";

import { useCallback, useState } from "react";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/section-header";
import { useTools } from "@/hooks/use-tools";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { useStoreState } from "@/stores/use-state";

interface ExpenseEntry {
  description: string;
  amount: number;
  date: string;
}

interface MonthlySnapshot {
  month: string; // "2025-04"
  monthName: string; // "April 2025"
  revenue: number;
  hpp: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}

interface PLData {
  period: { startDate: string; endDate: string; label: string };
  current: {
    revenue: number;
    hpp: number;
    grossProfit: number;
    grossMargin: number;
    expenses: number;
    expenseBreakdown: ExpenseEntry[];
    netProfit: number;
    netMargin: number;
    totalOrders: number;
    totalQtySold: number;
  };
  previous: {
    revenue: number;
    grossProfit: number;
    netProfit: number;
  };
  monthly: MonthlySnapshot[];
}

function GrowthChip({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  if (previous === 0) return null;
  const rate = ((current - previous) / previous) * 100;
  if (rate > 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
        <TrendingUp className="h-3 w-3" />+{rate.toFixed(1)}%
      </span>
    );
  if (rate < 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-red-500">
        <TrendingDown className="h-3 w-3" />
        {rate.toFixed(1)}%
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
      <Minus className="h-3 w-3" />
      0%
    </span>
  );
}

function PLRow({
  label,
  amount,
  sub,
  highlight,
  negative,
  bold,
  indent,
}: {
  label: string;
  amount: number;
  sub?: string;
  highlight?: boolean;
  negative?: boolean;
  bold?: boolean;
  indent?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 py-2 ${
        highlight ? "bg-muted rounded-lg px-3 -mx-3" : ""
      } ${indent ? "pl-4" : ""}`}
    >
      <div>
        <p
          className={`text-sm ${bold ? "font-semibold" : ""} ${highlight ? "font-semibold" : ""}`}
        >
          {label}
        </p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      <p
        className={`text-sm tabular-nums shrink-0 ${
          bold || highlight ? "font-semibold" : ""
        } ${
          negative
            ? "text-muted-foreground"
            : highlight
              ? amount >= 0
                ? "text-primary"
                : "text-destructive"
              : ""
        }`}
      >
        {negative ? `- ${formatCurrency(amount)}` : formatCurrency(amount)}
      </p>
    </div>
  );
}

export default function LaporanLabaRugi() {
  const { selectedOutletId } = useOutletContext();
  const { dateRange: dateRangeValue } = useStoreState();

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    dateRangeValue || {
      from: addDays(new Date(), -90),
      to: new Date(),
    },
  );

  const [expenseExpanded, setExpenseExpanded] = useState(false);

  const { incomeStatement } = useTools(selectedOutletId!, {
    from: dateRange?.from!,
    to: dateRange?.to!,
  });

  const data = incomeStatement.data;

  const MonthlyBar = useCallback(
    ({ data }: { data: MonthlySnapshot }) => {
      const max = Math.max(
        ...(incomeStatement.data?.monthly.map((m) => m.revenue) || [0]),
      );
      const revPct = (data.revenue / max) * 100;
      const netPct = (Math.max(0, data.netProfit) / max) * 100;
      const isProfit = data.netProfit >= 0;

      return (
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {formatCurrency(data.netProfit)}
          </span>
          <div className="relative w-10 h-28 flex items-end">
            <div
              className="absolute bottom-0 left-0 right-0 bg-primary/20 rounded-t-sm"
              style={{ height: `${revPct}%` }}
            />
            <div
              className={`absolute bottom-0 left-0 right-0 rounded-t-sm ${isProfit ? "bg-primary" : "bg-destructive"}`}
              style={{ height: `${netPct}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {data.monthName}
          </span>
        </div>
      );
    },
    [incomeStatement.data],
  );

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          Memuat laporan laba rugi...
        </p>
      </div>
    );
  }

  const { current, previous, monthly } = data;

  return (
    <div className="space-y-3">
      {/* Header */}
      <SectionHeader
        title="Laporan Laba Rugi"
        description={`${data.period.label} · ${current.totalOrders} transaksi · ${current.totalQtySold.toLocaleString("id-ID")} item terjual`}
        actions={<DateRangeFilter value={dateRange} onChange={setDateRange} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* P&L Statement */}
        <div className="lg:col-span-2 space-y-3">
          <Card className="shadow-none gap-0 py-0 border-border/50">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Laporan Laba Rugi — {data.period.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-0.5">
              {/* Revenue */}
              <PLRow
                label="Pendapatan Penjualan"
                amount={current.revenue}
                sub={`${current.totalOrders} transaksi selesai`}
                bold
              />

              <Separator className="my-2" />

              {/* COGS */}
              <PLRow
                label="Harga Pokok Penjualan (HPP)"
                amount={current.hpp}
                negative
              />

              <Separator className="my-2" />

              {/* Gross Profit */}
              <PLRow
                label="Laba Kotor"
                amount={current.grossProfit}
                sub={`Gross margin ${current.grossMargin.toFixed(1)}%`}
                highlight
                bold
              />

              <div className="py-2" />

              {/* Expenses */}
              <div>
                <button
                  type="button"
                  onClick={() => setExpenseExpanded(!expenseExpanded)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div>
                    <p className="text-sm">Beban Operasional</p>
                    <p className="text-xs text-muted-foreground">
                      {current.expenseBreakdown.length} pos pengeluaran
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm tabular-nums text-muted-foreground">
                      - {formatCurrency(current.expenses)}
                    </p>
                    {expenseExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {expenseExpanded && (
                  <div className="mt-2 space-y-0.5 border-l-2 border-border/50 ml-2 pl-3">
                    {current.expenseBreakdown.map((e, i) => (
                      <PLRow
                        key={i}
                        label={e.description}
                        amount={e.amount}
                        negative
                        indent
                      />
                    ))}
                  </div>
                )}
              </div>

              <Separator className="my-2" />

              {/* Net Profit */}
              <PLRow
                label="Laba Bersih"
                amount={current.netProfit}
                sub={`Net margin ${current.netMargin.toFixed(1)}%`}
                highlight
                bold
              />
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card className="shadow-none gap-0 py-0 border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base font-medium">
                Tren Bulanan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="flex items-end gap-3 justify-around">
                {monthly.map((m) => (
                  <MonthlyBar key={m.month} data={m} />
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 justify-center">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm bg-primary/20" />
                  <span className="text-xs text-muted-foreground">Omzet</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm bg-primary" />
                  <span className="text-xs text-muted-foreground">
                    Laba bersih
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-3">
          {/* vs Period Sebelumnya */}
          <Card className="shadow-none gap-0 py-0 border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                vs Periode Sebelumnya
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              {[
                {
                  label: "Omzet",
                  current: current.revenue,
                  prev: previous.revenue,
                },
                {
                  label: "Laba Kotor",
                  current: current.grossProfit,
                  prev: previous.grossProfit,
                },
                {
                  label: "Laba Bersih",
                  current: current.netProfit,
                  prev: previous.netProfit,
                },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {item.label}
                    </span>
                    <GrowthChip current={item.current} previous={item.prev} />
                  </div>
                  <p className="text-base font-semibold tabular-nums">
                    {formatCurrency(item.current)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sebelumnya: {formatCurrency(item.prev)}
                  </p>
                  {item.label !== "Laba Bersih" && (
                    <Separator className="mt-2" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Margin Summary */}
          <Card className="shadow-none gap-0 py-0 border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ringkasan Margin
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-3">
              {[
                {
                  label: "Gross Margin",
                  value: current.grossMargin,
                  threshold: { healthy: 40, warning: 20 },
                },
                {
                  label: "Net Margin",
                  value: current.netMargin,
                  threshold: { healthy: 20, warning: 10 },
                },
                {
                  label: "Rasio HPP",
                  value: (current.hpp / current.revenue) * 100,
                  threshold: { healthy: 0, warning: 0 },
                  invert: true,
                },
                {
                  label: "Rasio Beban",
                  value: (current.expenses / current.revenue) * 100,
                  threshold: { healthy: 0, warning: 0 },
                  invert: true,
                },
              ].map((item) => {
                const isHealthy = !item.invert
                  ? item.value >= item.threshold.healthy
                  : item.value < 40;
                const isWarning = !item.invert
                  ? item.value >= item.threshold.warning &&
                    item.value < item.threshold.healthy
                  : item.value >= 40 && item.value < 60;

                const badgeClass = isHealthy
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : isWarning
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-red-50 text-red-700 border-red-200";

                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-muted-foreground">
                      {item.label}
                    </span>
                    <Badge
                      className={`${badgeClass} hover:${badgeClass} border tabular-nums`}
                    >
                      {item.value.toFixed(1)}%
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Top Expenses */}
          <Card className="shadow-none gap-0 py-0 border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Beban Terbesar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2">
              {current.expenseBreakdown.slice(0, 4).map((e, i) => {
                const pct = (e.amount / current.expenses) * 100;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate pr-2">
                        {e.description}
                      </span>
                      <span className="tabular-nums font-medium shrink-0">
                        {formatCurrency(e.amount)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
