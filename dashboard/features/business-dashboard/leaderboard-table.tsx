"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";

type Outlet = {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  products: number;
  services: number;
};

interface LeaderboardTableProps {
  outlets: Array<Outlet>;
}

const fmtNumber = (v: number) => new Intl.NumberFormat("id-ID").format(v);

export function LeaderboardTable({ outlets }: LeaderboardTableProps) {
  const columns: ColumnDef<Outlet>[] = [
    {
      id: "rank",
      header: "#",
      accessorKey: "id",
      cell: ({ row }) => {
        const idx = row.index;
        return (
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              idx === 0
                ? "bg-amber-500/20 text-amber-700"
                : idx === 1
                  ? "bg-slate-400/20 text-slate-700"
                  : idx === 2
                    ? "bg-orange-400/20 text-orange-700"
                    : "bg-muted text-muted-foreground"
            }`}
          >
            {idx + 1}
          </div>
        );
      },
      size: 40,
    },
    {
      accessorKey: "name",
      filterFn: "equals",
      header: "Outlet",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">
            {row.original.name}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
            {row.original.orders} pesanan
          </span>
        </div>
      ),
    },
    {
      accessorKey: "revenue",
      header: "Pendapatan",
      cell: ({ row }) => {
        const idx = row.index;
        return (
          <div className="flex items-center gap-1 font-bold tabular-nums text-foreground">
            {formatCurrency(row.original.revenue)}
            {idx === 0 && <ArrowUpRight className="h-3 w-3 text-green-500" />}
          </div>
        );
      },
    },
    {
      accessorKey: "orders",
      header: "Pesanan",
      cell: ({ row }) => (
        <div className="tabular-nums">{fmtNumber(row.original.orders)}</div>
      ),
    },
    {
      accessorKey: "products",
      header: "Produk",
      cell: ({ row }) => (
        <div className="tabular-nums">{fmtNumber(row.original.products)}</div>
      ),
    },
    {
      accessorKey: "services",
      header: "Layanan",
      cell: ({ row }) => (
        <div className="tabular-nums">{fmtNumber(row.original.services)}</div>
      ),
    },
  ];

  return (
    <DataTable
      title="Leaderboard Outlet"
      description="Peringkat performa outlet berdasarkan pendapatan tertinggi."
      columns={columns}
      data={outlets}
      searchKey="name"
      searchPlaceholder="Cari outlet..."
      density="compact"
      pagination={false}
      bordered={false}
      striped={true}
    />
  );
}
