import { Card } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { Totals } from "./report-financial-table";
import { ViewMode } from "./types";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Sparkline } from "../sparkline";

function MetricCard({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <Card className="rounded-lg border border-border/80 p-4 shadow-sm bg-card">
      <p className="text-xs text-muted-foreground font-medium mb-1.5">
        {label}
      </p>
      <p
        className={cn(
          "text-lg font-bold tabular-nums tracking-tight",
          valueClass,
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
}

export function FinancialMetricStrip({
  totals,
  totalBeban,
  activeData,
  viewMode,
}: {
  totals: Totals;
  totalBeban: number;
  activeData: any[];
  viewMode: ViewMode;
}) {
  const isProfit = totals.labaBersih >= 0;
  const sparkData =
    viewMode === "time" ? activeData.map((d) => d.labaBersih || 0) : [];
  const totalBase = Math.max(totals.totalPendapatan, 1);
  const marginPct = ((totals.labaBersih / totalBase) * 100).toFixed(1);

  const fmt = formatCurrency;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Laba Bersih — hero */}
      <Card
        className={cn(
          "col-span-2 sm:col-span-2 rounded-lg border-l-4 p-4 shadow-sm",
          isProfit
            ? "border-l-emerald-500 bg-emerald-500/5"
            : "border-l-rose-500 bg-rose-500/5",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Laba Bersih
            </p>
            <p
              className={cn(
                "text-2xl font-extrabold tabular-nums tracking-tight",
                isProfit
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400",
              )}
            >
              {fmt(totals.labaBersih)}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0 border-none shadow-none",
                  isProfit
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-rose-500/15 text-rose-600",
                )}
              >
                {isProfit ? (
                  <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5 inline" />
                )}
                {isProfit ? "Untung" : "Rugi"} {marginPct}%
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                dari omset
              </span>
            </div>
          </div>
          {sparkData.length >= 2 && (
            <div className="shrink-0 bg-background/70 border border-border/30 rounded-md p-1">
              <Sparkline
                data={sparkData}
                color={isProfit ? "#10b981" : "#f43f5e"}
                width={80}
                height={28}
              />
            </div>
          )}
        </div>

        {/* Allocation mini bar */}
        <div className="mt-3 pt-3 border-t border-border/20">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden flex">
            {[
              {
                val: totals.labaBersih > 0 ? totals.labaBersih : 0,
                color: "bg-emerald-500",
              },
              { val: totals.totalHpp, color: "bg-amber-500" },
              { val: totals.totalPengeluaran, color: "bg-rose-500" },
              { val: totals.gajiStaf, color: "bg-blue-500" },
              { val: totals.totalFees, color: "bg-slate-400" },
            ].map(({ val, color }, i) => {
              const pct = (val / Math.max(totals.totalPendapatan, 1)) * 100;
              return pct > 0 ? (
                <div
                  key={i}
                  className={cn(color, "h-full")}
                  style={{ width: `${pct}%` }}
                />
              ) : null;
            })}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {[
              {
                label: "Laba",
                color: "bg-emerald-500",
                val: totals.labaBersih,
              },
              { label: "HPP", color: "bg-amber-500", val: totals.totalHpp },
              {
                label: "Ops",
                color: "bg-rose-500",
                val: totals.totalPengeluaran,
              },
              { label: "Komisi", color: "bg-blue-500", val: totals.gajiStaf },
            ].map(({ label, color, val }) => (
              <div key={label} className="flex items-center gap-1">
                <div
                  className={cn("w-1.5 h-1.5 rounded-full shrink-0", color)}
                />
                <span className="text-[10px] text-muted-foreground">
                  {label}: {fmt(val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Omset */}
      <MetricCard
        label="Omset Penjualan"
        value={fmt(totals.totalPendapatan)}
        sub={`${totals.jumlahTransaksi} Transaksi`}
        valueClass="text-foreground"
      />

      {/* Beban */}
      <MetricCard
        label="Total Beban"
        value={fmt(totalBeban)}
        sub={
          totals.totalPajak > 0
            ? `Pajak: ${fmt(totals.totalPajak)}`
            : "Tanpa pajak"
        }
        valueClass="text-rose-600 dark:text-rose-400"
      />
    </div>
  );
}

export function StaffMetricStrip({
  totals,
}: {
  totals: { transactions: number; revenue: number; commission: number };
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <MetricCard
        label="Total Komisi"
        value={formatCurrency(totals.commission)}
        sub="Staff layanan"
        valueClass="text-blue-600 dark:text-blue-400"
      />
      <MetricCard
        label="Omset Kasir"
        value={formatCurrency(totals.revenue)}
        sub="Dari kasir"
        valueClass="text-emerald-600 dark:text-emerald-400"
      />
      <MetricCard
        label="Total Transaksi"
        value={`${totals.transactions} Trx`}
        sub="Selesai diproses"
        valueClass="text-foreground"
      />
    </div>
  );
}

export function StokMetricStrip({
  totals,
}: {
  totals: { jumlahTransaksi: number; totalPembelian: number };
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard
        label="Total Pembelian Stok"
        value={formatCurrency(totals.totalPembelian)}
        sub="Nilai perolehan aset"
        valueClass="text-amber-600 dark:text-amber-400"
      />
      <MetricCard
        label="Order Masuk"
        value={`${totals.jumlahTransaksi} Order`}
        sub="Transaksi stock in"
        valueClass="text-foreground"
      />
    </div>
  );
}
