"use client";

import { DataTable } from "@/components/ui/data-table";
import { cn, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StaffReportItem } from "@/hooks/useReport";
import { Row } from "@tanstack/react-table";

export interface StaffTotals {
  transactions: number;
  revenue: number;
  commission: number;
}

interface ReportStaffTableProps {
  data: StaffReportItem[];
  totals: StaffTotals;
}

export function ReportStaffTable({ data, totals }: ReportStaffTableProps) {
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
          accessorKey: "name",
          header: "Nama Staff",
          cell: ({ row }) => <span className="font-bold text-foreground/90 text-xs">{row.original.name}</span>,
          footer: () => <span className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground opacity-60">Total Staff</span>,
        },
        {
          accessorKey: "role",
          header: "Role",
          cell: ({ row }: { row: Row<StaffReportItem> }) => {
            const item = row.original;
            return (
              <Badge
                variant="outline"
                className={cn(
                  "font-bold text-[10px] uppercase tracking-wider px-2 py-0 shadow-none border-opacity-20",
                  item.type === "CASHIER"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500"
                    : "bg-indigo-500/10 text-indigo-600 border-indigo-500"
                )}>
                {item.role}
              </Badge>
            );
          },
        },
        {
          accessorKey: "transactionCount",
          header: "Trx",
          cell: ({ row }) => <span className="font-bold text-foreground/80 tabular-nums text-xs">{row.original.transactionCount}</span>,
          footer: () => <span className="font-bold tabular-nums text-xs">{totals.transactions}</span>,
        },
        {
          accessorKey: "revenue",
          header: "Penjualan",
          cell: ({ row }: { row: Row<StaffReportItem> }) =>
            row.original.type === "CASHIER" ? (
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-xs">{formatCurrency(row.original.revenue)}</span>
            ) : <span className="opacity-20">-</span>,
          footer: () => <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-xs">{formatCurrency(totals.revenue)}</span>,
        },
        {
          accessorKey: "commission",
          header: "Komisi",
          cell: ({ row }: { row: Row<StaffReportItem> }) => (
            row.original.type === "SERVICE" ? (
              <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums text-xs">
                {formatCurrency(row.original.commission)}
              </span>
            ) : <span className="opacity-20">-</span>
          ),
          footer: () => (
            <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums text-xs">
              {formatCurrency(totals.commission)}
            </span>
          ),
        },
      ]}
    />
  );
}
