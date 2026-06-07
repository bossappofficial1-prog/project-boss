"use client";

import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { Package } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Product } from "./types";

function getMarginBadge(margin: number) {
  if (margin >= 40)
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
        {margin.toFixed(1)}%
      </Badge>
    );
  if (margin >= 20)
    return (
      <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
        {margin.toFixed(1)}%
      </Badge>
    );
  return (
    <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
      {margin.toFixed(1)}%
    </Badge>
  );
}

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "productName",
    header: "Produk",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
          {row.original.image ? (
            <img
              src={row.original.image}
              alt={row.original.productName}
              className="h-full w-full rounded-md object-cover"
            />
          ) : (
            <Package className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="font-medium text-sm">{row.original.productName}</p>
          <p className="text-xs text-muted-foreground">{row.original.unit}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "totalQtySold",
    header: "Qty Terjual",
    cell: ({ row }) => (
      <span className="tabular-nums text-sm">
        {row.original.totalQtySold.toLocaleString("id-ID")}
      </span>
    ),
  },
  {
    accessorKey: "avgSellingPrice",
    header: "Harga Jual",
    cell: ({ row }) => (
      <span className="tabular-nums text-sm">
        {formatCurrency(row.original.avgSellingPrice)}
      </span>
    ),
  },
  {
    accessorKey: "avgHpp",
    header: "HPP",
    cell: ({ row }) => (
      <span className="tabular-nums text-sm text-muted-foreground">
        {formatCurrency(row.original.avgHpp)}
      </span>
    ),
  },
  {
    accessorKey: "totalRevenue",
    header: "Total Omzet",
    cell: ({ row }) => (
      <span className="tabular-nums text-sm font-medium">
        {formatCurrency(row.original.totalRevenue)}
      </span>
    ),
  },
  {
    accessorKey: "totalProfit",
    header: "Total Profit",
    cell: ({ row }) => (
      <span className="tabular-nums text-sm font-medium text-primary">
        {formatCurrency(row.original.totalProfit)}
      </span>
    ),
  },
  {
    accessorKey: "marginPercentage",
    header: "Margin",
    cell: ({ row }) => getMarginBadge(row.original.marginPercentage),
  },
  {
    accessorKey: "contribution",
    header: "Kontribusi",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full"
            style={{ width: `${Math.min(row.original.contribution, 100)}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {row.original.contribution.toFixed(1)}%
        </span>
      </div>
    ),
  },
];

type ProductProfitTableProps = {
  products: Product[];
};

export function ProductProfitTable({ products }: ProductProfitTableProps) {
  return (
    <DataTable
      columns={columns}
      data={products}
      title="Detail Profit per Produk"
      emptyMessage="Belum ada produk yang terjual di periode ini."
      tableId="profit-per-product"
      density="comfortable"
    />
  );
}
