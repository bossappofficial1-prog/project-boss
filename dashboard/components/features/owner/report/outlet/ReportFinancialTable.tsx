"use client";

import { DataTable } from "@/components/ui/data-table";
import { OutletReport } from "@/hooks/useReport";
import { formatCurrency } from "@/lib/utils";
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
          footer: () => labelHeader || "Tanggal",
        },
        {
          accessorKey: "jumlahTransaksi",
          header: "Trx",
          footer: () => totals.jumlahTransaksi,
        },
        {
          accessorKey: "totalPendapatan",
          header: "(+) Penjualan",
          cell({ row }) {
            const totalPendapatan = row.original.totalPendapatan;
            return formatCurrency(totalPendapatan);
          },
          footer: () => formatCurrency(totals.totalPendapatan),
        },
        ...(!hideTrend
          ? [
            {
              accessorKey: "trend",
              header: "Tren",
              cell({ row: rows }: { row: Row<OutletReport> }) {
                const row = rows.original;
                return (
                  <div className="inline-flex items-center justify-center p-1 bg-slate-50 dark:bg-slate-900/50 rounded-md border border-slate-100 dark:border-slate-800">
                    <Sparkline
                      data={row.trend}
                      color={row.labaBersih > 0 ? "#10b981" : "#f43f5e"}
                    />
                  </div>
                );
              },
              footer: () => <Activity className="w-5 h-5 mx-auto text-emerald-500 opacity-50" />,
            } as any,
          ]
          : []),
        {
          accessorKey: "totalHpp",
          header: "(-) Modal (HPP)",
          cell: (props: any) => (
            <span className="text-orange-600 dark:text-orange-400/80">
              {formatCurrency(props.row.original.totalHpp || 0)}
            </span>
          ),
          footer: () => (
            <span className="text-orange-600 dark:text-orange-400/80">
              {formatCurrency(totals.totalHpp || 0)}
            </span>
          ),
        },
        {
          accessorKey: "totalPengeluaran",
          header: "(-) Beban Ops",
          cell: (props: any) => (
            <span className="text-rose-600 dark:text-rose-400/80">
              {formatCurrency(props.row.original.totalPengeluaran || 0)}
            </span>
          ),
          footer: () => (
            <span className="text-rose-600 dark:text-rose-400/80">
              {formatCurrency(totals.totalPengeluaran || 0)}
            </span>
          ),
        },
        {
          accessorKey: "gajiStaf",
          header: "(-) Komisi",
          cell: (props: any) => (
            <span className="text-blue-600 dark:text-blue-400/80">
              {formatCurrency(props.row.original.gajiStaf || 0)}
            </span>
          ),
          footer: () => (
            <span className="text-blue-600 dark:text-blue-400/80">
              {formatCurrency(totals.gajiStaf || 0)}
            </span>
          ),
        },
        // {
        //   accessorKey: "totalFees",
        //   header: "(-) Layanan",
        //   cell: (props: any) => (
        //     <span className="text-slate-500 dark:text-slate-400">
        //       {formatCurrency(props.row.original.totalFees || 0)}
        //     </span>
        //   ),
        //   footer: () => (
        //     <span className="text-slate-500 dark:text-slate-400">
        //       {formatCurrency(totals.totalFees || 0)}
        //     </span>
        //   ),
        // },
        {
          accessorKey: "labaBersih",
          header: "= Laba Bersih",
          cell: (props: any) => (
            <span
              className={
                (props.row.original.labaBersih || 0) >= 0
                  ? "text-green-600 dark:text-green-400/80 font-bold"
                  : "text-red-600 dark:text-red-400/80 font-bold"
              }>
              {formatCurrency(props.row.original.labaBersih || 0)}
            </span>
          ),
          footer: () => (
            <span
              className={
                (totals.labaBersih || 0) >= 0
                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-rose-600 dark:text-rose-400 font-bold"
              }>
              {formatCurrency(totals.labaBersih || 0)}
            </span>
          ),
        },
      ]}
    />
  );
}
