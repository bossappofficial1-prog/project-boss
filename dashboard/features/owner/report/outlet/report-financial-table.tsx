"use client";

import { DataTable } from "@/components/ui/data-table";
import { OutletReport } from "@/hooks/use-report";
import { cn, formatCurrency } from "@/lib/utils";
import { Sparkline } from "../sparkline";
import { Activity } from "lucide-react";
import { Row } from "@tanstack/react-table";

export interface Totals {
  jumlahTransaksi: number;
  totalPendapatan: number;
  totalPajak: number;
  totalPembelian: number;
  totalPengeluaran: number;
  gajiStaf: number;
  totalHpp: number;
  totalFees: number;
  labaBersih: number;
}

type ReportFinancialTableProps = {
  data: OutletReport[];
  totals: Totals;
  hideTrend?: boolean;
  labelHeader?: string;
};

export function ReportFinancialTable({
  data,
  totals,
  hideTrend,
  labelHeader,
}: ReportFinancialTableProps) {
  return (
    <DataTable
      data={data}
      pageSize={50}
      globalFilter={false}
      showColumnVisibility={false}
      showTableInfo={false}
      pagination
      showFooter
      tableId="report-financial"
      emptyMessage="Belum ada data laporan keuangan untuk periode ini."
      columns={[
        {
          accessorKey: "label",
          header: labelHeader || "Tanggal",
          cell: ({ row }) => (
            <span className="font-bold text-foreground/90 text-xs">
              {row.original.label}
            </span>
          ),
          footer: () => (
            <span className="font-semibold text-xs text-muted-foreground opacity-75">
              Total Periode
            </span>
          ),
        },
        {
          accessorKey: "jumlahTransaksi",
          header: "Trx",
          cell: ({ row }) => (
            <span className="font-bold text-foreground/80 tabular-nums text-xs">
              {row.original.jumlahTransaksi}
            </span>
          ),
          footer: () => (
            <span className="font-bold tabular-nums text-xs">
              {totals.jumlahTransaksi}
            </span>
          ),
        },
        {
          accessorKey: "totalPendapatan",
          header: "(+) Penjualan",
          cell({ row }) {
            const totalPendapatan = row.original.totalPendapatan;
            return (
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-xs">
                {formatCurrency(totalPendapatan)}
              </span>
            );
          },
          footer: () => (
            <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-xs">
              {formatCurrency(totals.totalPendapatan)}
            </span>
          ),
        },
        {
          accessorKey: "totalPajak",
          header: "(+) Pajak",
          cell({ row }) {
            const p = row.original.totalPajak;
            return p ? (
              <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums text-xs">
                {formatCurrency(p)}
              </span>
            ) : (
              <span className="text-muted-foreground/40 text-xs">—</span>
            );
          },
          footer: () => (
            <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums text-xs">
              {formatCurrency(totals.totalPajak)}
            </span>
          ),
        },
        ...(!hideTrend
          ? [
              {
                accessorKey: "trend",
                header: "Tren",
                cell({ row }: { row: Row<OutletReport> }) {
                  const original = row.original;
                  return (
                    <div className="inline-flex items-center justify-center p-1.5 bg-muted/30 rounded-md border border-border/40">
                      <Sparkline
                        data={original.trend}
                        color={original.labaBersih > 0 ? "#10b981" : "#f43f5e"}
                      />
                    </div>
                  );
                },
                footer: () => (
                  <Activity className="w-4 h-4 mx-auto text-muted-foreground opacity-20" />
                ),
              },
            ]
          : []),
        {
          accessorKey: "totalHpp",
          header: "(-) Modal (HPP)",
          cell: ({ row }: { row: Row<OutletReport> }) => (
            <span className="text-amber-600 dark:text-amber-400/80 font-bold tabular-nums text-xs">
              {formatCurrency(row.original.totalHpp || 0)}
            </span>
          ),
          footer: () => (
            <span className="text-amber-600 dark:text-amber-400/80 font-bold tabular-nums text-xs">
              {formatCurrency(totals.totalHpp || 0)}
            </span>
          ),
        },
        {
          accessorKey: "totalPengeluaran",
          header: "(-) Beban Ops",
          cell: ({ row }: { row: Row<OutletReport> }) => (
            <span className="text-rose-600 dark:text-rose-400/80 font-bold tabular-nums text-xs">
              {formatCurrency(row.original.totalPengeluaran || 0)}
            </span>
          ),
          footer: () => (
            <span className="text-rose-600 dark:text-rose-400/80 font-bold tabular-nums text-xs">
              {formatCurrency(totals.totalPengeluaran || 0)}
            </span>
          ),
        },
        {
          accessorKey: "gajiStaf",
          header: "(-) Komisi",
          cell: ({ row }: { row: Row<OutletReport> }) => (
            <span className="text-blue-600 dark:text-blue-400/80 font-bold tabular-nums text-xs">
              {formatCurrency(row.original.gajiStaf || 0)}
            </span>
          ),
          footer: () => (
            <span className="text-blue-600 dark:text-blue-400/80 font-bold tabular-nums text-xs">
              {formatCurrency(totals.gajiStaf || 0)}
            </span>
          ),
        },
        {
          accessorKey: "labaBersih",
          header: "= Laba Bersih",
          cell: ({ row }: { row: Row<OutletReport> }) => (
            <div
              className={cn(
                "font-bold tabular-nums text-xs px-2 py-0.5 rounded-sm inline-block",
                (row.original.labaBersih || 0) >= 0
                  ? "text-emerald-600 bg-emerald-500/10"
                  : "text-rose-600 bg-rose-500/10",
              )}
            >
              {formatCurrency(row.original.labaBersih || 0)}
            </div>
          ),
          footer: () => (
            <div
              className={cn(
                "font-bold tabular-nums text-xs px-2 py-1 rounded-sm inline-block",
                (totals.labaBersih || 0) >= 0
                  ? "text-emerald-600 bg-emerald-500/10"
                  : "text-rose-600 bg-rose-500/10",
              )}
            >
              {formatCurrency(totals.labaBersih || 0)}
            </div>
          ),
        },
      ]}
    />
  );
}
