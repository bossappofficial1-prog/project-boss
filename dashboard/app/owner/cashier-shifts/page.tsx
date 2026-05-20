"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Loader2, RefreshCcw } from "lucide-react";

import { useOutletContext } from "@/components/providers/OutletProvider";
import { DataTable } from "@/components/ui/data-table";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listOwnerCashierShifts, type OwnerShiftRow } from "@/lib/apis/cashier-shifts";

function formatIdr(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function OwnerCashierShiftsPage() {
  const { selectedOutletId: outletId } = useOutletContext();

  const from = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }, []);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["owner-cashier-shifts", outletId, from],
    queryFn: async () => {
      if (!outletId) return [] as OwnerShiftRow[];
      return listOwnerCashierShifts({ outletId, from });
    },
    enabled: !!outletId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title="Shift Kasir"
        description="Pantau buka/tutup shift, total penjualan, dan cash movement per shift."
        actions={
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="h-10 text-[10px] font-bold"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
            {isFetching && !isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          </Button>
        }
      />

      <DataTable
        isLoading={isLoading}
        isRefreshing={isFetching && !isLoading}
        onRefresh={refetch}
        data={data || []}
        emptyMessage="Belum ada shift pada rentang waktu ini."
        columns={[
          {
            accessorKey: "openedAt",
            header: "Dibuka",
            cell: ({ row }) => (
              <div className="flex flex-col">
                <span className="font-bold text-foreground/90 text-xs tabular-nums">
                  {format(new Date(row.original.openedAt), "dd MMM yyyy", { locale: localeId })}
                </span>
                <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                  {format(new Date(row.original.openedAt), "HH:mm", { locale: localeId })}
                </span>
              </div>
            ),
          },
          {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
              <Badge
                variant={row.original.status === "OPEN" ? "success" : "secondary"}
                className="font-bold text-[9px] uppercase tracking-wider"
              >
                {row.original.status}
              </Badge>
            ),
          },
          {
            accessorKey: "staff",
            header: "Kasir",
            cell: ({ row }) => (
              <div className="flex flex-col">
                <span className="font-bold text-foreground/80 text-xs truncate max-w-[220px]">
                  {row.original.staff?.name ?? "-"}
                </span>
                <span className="text-[10px] text-muted-foreground/60 truncate max-w-[220px]">
                  {row.original.staff?.username ?? ""}
                </span>
              </div>
            ),
          },
          {
            accessorKey: "openingCash",
            header: "Opening",
            cell: ({ row }) => (
              <span className="font-mono text-xs tabular-nums">{formatIdr(row.original.openingCash)}</span>
            ),
          },
          {
            accessorKey: "closingCash",
            header: "Closing",
            cell: ({ row }) => (
              <span className="font-mono text-xs tabular-nums">
                {row.original.closingCash == null ? "-" : formatIdr(row.original.closingCash)}
              </span>
            ),
          },
          {
            accessorKey: "salesTotal",
            header: "Total Sales",
            cell: ({ row }) => (
              <div className="flex flex-col">
                <span className="font-mono text-xs tabular-nums">
                  {formatIdr(row.original.totals?.salesTotal ?? 0)}
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  {row.original.totals?.transactionCount ?? 0} trx
                </span>
              </div>
            ),
          },
          {
            accessorKey: "cashMovementNet",
            header: "Cash Move",
            cell: ({ row }) => (
              <span className="font-mono text-xs tabular-nums">
                {formatIdr(row.original.totals?.cashMovementNet ?? 0)}
              </span>
            ),
          },
          {
            accessorKey: "closedAt",
            header: "Ditutup",
            cell: ({ row }) => {
              if (!row.original.closedAt) return <span className="text-xs text-muted-foreground">-</span>;
              return (
                <div className="flex flex-col">
                  <span className="font-bold text-foreground/90 text-xs tabular-nums">
                    {format(new Date(row.original.closedAt), "dd MMM yyyy", { locale: localeId })}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                    {format(new Date(row.original.closedAt), "HH:mm", { locale: localeId })}
                  </span>
                </div>
              );
            },
          },
        ]}
      />
    </div>
  );
}
