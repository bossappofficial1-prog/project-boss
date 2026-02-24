"use client";

import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";
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
          footer: "Total",
        },
        {
          accessorKey: "role",
          header: "Role",
          cell: ({ row }: { row: Row<StaffReportItem> }) => {
            const item = row.original;
            return (
              <Badge
                variant={item.type === "CASHIER" ? "default" : "secondary"}
                className={
                  item.type === "CASHIER"
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none"
                    : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none"
                }>
                {item.role}
              </Badge>
            );
          },
        },
        {
          accessorKey: "transactionCount",
          header: "Trx",
          footer: () => totals.transactions,
        },
        {
          accessorKey: "revenue",
          header: "Penjualan",
          cell: ({ row }: { row: Row<StaffReportItem> }) =>
            row.original.type === "CASHIER" ? formatCurrency(row.original.revenue) : "-",
          footer: () => formatCurrency(totals.revenue),
        },
        {
          accessorKey: "commission",
          header: "Komisi",
          cell: ({ row }: { row: Row<StaffReportItem> }) => (
            <span className="text-blue-600 dark:text-blue-400/80">
              {row.original.type === "SERVICE" ? formatCurrency(row.original.commission) : "-"}
            </span>
          ),
          footer: () => (
            <span className="text-blue-600 dark:text-blue-400/80">
              {formatCurrency(totals.commission)}
            </span>
          ),
        },
      ]}
    />
  );
}
