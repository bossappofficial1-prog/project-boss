"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Customer } from "@/hooks/useCustomers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CustomerTableProps {
  data: Customer[];
  isLoading: boolean;
  isRefetching: boolean;
  searchKey: string;
  onSearchChange: (value: string) => void;
  page: number;
  limit: number;
  totalItems: number;
  onPaginationChange: (params: { page: number; limit: number }) => void;
  onViewDetail: (customer: Customer) => void;
}

export default function CustomerTable({
  data,
  isLoading,
  isRefetching,
  searchKey,
  onSearchChange,
  page,
  limit,
  totalItems,
  onPaginationChange,
  onViewDetail,
}: CustomerTableProps) {
  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nama Pelanggan",
        cell: ({ row }) => {
          const name = row.original.name || "-";
          return <div className="font-bold text-foreground/90 tracking-tight">{name}</div>;
        },
      },
      {
        accessorKey: "phone",
        header: "No. HP / WA",
        cell: ({ row }) => {
          const phone = row.original.phone || "-";
          return <div className="text-xs font-bold text-muted-foreground tabular-nums">{phone}</div>;
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => {
          const email = row.original.email || "-";
          return <div className="text-xs font-medium text-muted-foreground opacity-70 italic">{email}</div>;
        },
      },
      {
        accessorKey: "orders",
        header: "Total Pesanan",
        cell: ({ row }) => {
          const totalOrders = row.original._count?.orders ?? 0;
          return (
            <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-wider px-2 py-0 border-primary/20 bg-primary/5 text-primary">
              {totalOrders} Pesanan
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Bergabung Pada",
        cell: ({ row }) => {
          if (!row.original.createdAt) return <span className="text-xs text-muted-foreground opacity-30 italic">-</span>;
          try {
            return (
              <div className="text-xs font-medium text-muted-foreground tabular-nums">
                {format(new Date(row.original.createdAt), "dd MMM yyyy", { locale: id })}
              </div>
            );
          } catch {
            return <span className="text-xs text-muted-foreground opacity-30 italic">-</span>;
          }
        },
      },
      {
        id: "lastTransaction",
        header: "Transaksi Terakhir",
        cell: ({ row }) => {
          const lastTransactionDate = row.original.orders?.[0]?.createdAt || row.original.memberships?.[0]?.joinedAt;
          if (!lastTransactionDate) return <span className="text-xs text-muted-foreground opacity-30 italic">-</span>;

          try {
            return (
              <div className="text-xs font-medium text-muted-foreground tabular-nums">
                {format(new Date(lastTransactionDate), "dd MMM yyyy, HH:mm", { locale: id })}
              </div>
            );
          } catch {
            return <span className="text-xs text-muted-foreground opacity-30 italic">-</span>;
          }
        },
      },
      {
        id: "detail",
        header: "Aksi",
        cell: ({ row }) => {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetail(row.original)}
              className="h-8 font-bold text-[10px] uppercase tracking-wider border-border/60 hover:bg-muted/50 transition-all shadow-none"
            >
              Detail
            </Button>
          );
        },
      },
    ],
    [onViewDetail]
  );

  return (
    <div className="bg-background border border-border/80 rounded-md overflow-hidden shadow-sm">
      <DataTable
        columns={columns}
        data={data}
        searchDebounceMs={300}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        serverSideSearch={true}
        searchValue={searchKey}
        onSearchChange={onSearchChange}
        searchPlaceholder="Cari nama atau nomor telepon..."
        serverSidePagination={true}
        serverPage={page}
        serverLimit={limit}
        totalItems={totalItems}
        onPaginationChange={onPaginationChange}
        emptyMessage="Data pelanggan tidak ditemukan atau masih kosong."
      />
    </div>
  );
}
