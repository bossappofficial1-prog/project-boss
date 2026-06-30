import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import type { OutletReport } from "@/hooks/use-report";

export function StockAssetTable({
  data,
  totalPembelian,
}: {
  data: OutletReport[];
  totalPembelian: number;
}) {
  const columns: ColumnDef<OutletReport>[] = [
    {
      accessorKey: "label",
      header: "Periode",
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
      accessorKey: "totalPembelian",
      header: "Pembelian Stok (Aset)",
      cell: ({ row }) => (
        <span className="text-amber-600 dark:text-amber-400/80 font-bold tabular-nums text-xs">
          {formatCurrency(row.original.totalPembelian || 0)}
        </span>
      ),
      footer: () => (
        <span className="text-amber-600 dark:text-amber-400/80 font-bold tabular-nums text-xs">
          {formatCurrency(totalPembelian)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      pageSize={10}
      globalFilter={false}
      showColumnVisibility={false}
      showTableInfo={false}
      pagination
      showFooter
      tableId="report-stock"
      emptyMessage="Belum ada data pembelian stok untuk periode ini."
    />
  );
}
