"use client";

import { DataTable } from "@/components/ui/data-table";
import { OutletReport } from "@/hooks/useReport";
import { cn, formatCurrency } from "@/lib/utils";
import { Sparkline } from "../Sparkline";
import { Activity } from "lucide-react";
import { Row } from "@tanstack/react-table";

export interface Totals {
  jumlahTransaksi: number;
  totalPendapatan: number;
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
      pagination={false}
      showFooter
      columns={[
        {
          accessorKey: "label",
          header: labelHeader || "Tanggal",
          cell: ({ row }) => <span className="font-bold text-foreground/90 text-xs">{row.original.label}</span>,
          footer: () => <span className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground opacity-60">Total Periode</span>,
        },
        {
          accessorKey: "jumlahTransaksi",
          header: "Trx",
          cell: ({ row }) => <span className="font-bold text-foreground/80 tabular-nums text-xs">{row.original.jumlahTransaksi}</span>,
          footer: () => <span className="font-bold tabular-nums text-xs">{totals.jumlahTransaksi}</span>,
        },
        {
          accessorKey: "totalPendapatan",
          header: "(+) Penjualan",
          cell({ row }) {
            const totalPendapatan = row.original.totalPendapatan;
            return <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-xs">{formatCurrency(totalPendapatan)}</span>;
          },
          footer: () => <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-xs">{formatCurrency(totals.totalPendapatan)}</span>,
        },
        ...(!hideTrend
          ? [
            {
              accessorKey: "trend",
              header: "Tren",
              cell({ row: rows }: { row: Row<OutletReport> }) {
                const row = rows.original;
                return (
                  <div className="inline-flex items-center justify-center p-1.5 bg-muted/30 rounded-md border border-border/40">
                    <Sparkline
                      data={row.trend}
                      color={row.labaBersih > 0 ? "#10b981" : "#f43f5e"}
                    />
                  </div>
                );
              },
              footer: () => <Activity className="w-4 h-4 mx-auto text-muted-foreground opacity-20" />,
            } as any,
          ]
          : []),
        {
          accessorKey: "totalHpp",
          header: "(-) Modal (HPP)",
          cell: (props: any) => (
            <span className="text-amber-600 dark:text-amber-400/80 font-bold tabular-nums text-xs">
              {formatCurrency(props.row.original.totalHpp || 0)}
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
          cell: (props: any) => (
            <span className="text-rose-600 dark:text-rose-400/80 font-bold tabular-nums text-xs">
              {formatCurrency(props.row.original.totalPengeluaran || 0)}
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
          cell: (props: any) => (
            <span className="text-blue-600 dark:text-blue-400/80 font-bold tabular-nums text-xs">
              {formatCurrency(props.row.original.gajiStaf || 0)}
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
          cell: (props: any) => (
            <div
              className={cn(
                "font-bold tabular-nums text-xs px-2 py-0.5 rounded-sm inline-block",
                (props.row.original.labaBersih || 0) >= 0
                  ? "text-emerald-600 bg-emerald-500/10"
                  : "text-rose-600 bg-rose-500/10"
              )}>
              {formatCurrency(props.row.original.labaBersih || 0)}
            </div>
          ),
          footer: () => (
            <div
              className={cn(
                "font-bold tabular-nums text-xs px-2 py-1 rounded-sm inline-block",
                (totals.labaBersih || 0) >= 0
                  ? "text-emerald-600 bg-emerald-500/10"
                  : "text-rose-600 bg-rose-500/10"
              )}>
              {formatCurrency(totals.labaBersih || 0)}
            </div>
          ),
        },
      ]}
    />
  );
}
