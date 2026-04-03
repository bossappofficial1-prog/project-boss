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
          return <div className="font-medium text-foreground">{name}</div>;
        },
      },
      {
        accessorKey: "phone",
        header: "No. HP / WA",
        cell: ({ row }) => {
          const phone = row.original.phone || "-";
          return <div className="text-muted-foreground">{phone}</div>;
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => {
          const email = row.original.email || "-";
          return <div className="text-muted-foreground">{email}</div>;
        },
      },
      {
        accessorKey: "orders",
        header: "Total Pesanan",
        cell: ({ row }) => {
          const totalOrders = row.original._count?.orders ?? 0;
          return (
            <Badge variant="secondary" className="font-semibold px-2 py-1">
              {totalOrders} Pesanan
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Bergabung Pada",
        cell: ({ row }) => {
          if (!row.original.createdAt) return "-";
          try {
            return format(new Date(row.original.createdAt), "dd MMM yyyy", { locale: id });
          } catch {
            return "-";
          }
        },
      },
      {
        id: "lastTransaction",
        header: "Transaksi Terakhir",
        cell: ({ row }) => {
          const lastTransactionDate = row.original.orders?.[0]?.createdAt || row.original.memberships?.[0]?.joinedAt;
          if (!lastTransactionDate) return "-";

          try {
            return format(new Date(lastTransactionDate), "dd MMM yyyy, HH:mm", { locale: id });
          } catch {
            return "-";
          }
        },
      },
      {
        id: "detail",
        header: "Detail",
        cell: ({ row }) => {
          return (
            <Button variant="outline" size="sm" onClick={() => onViewDetail(row.original)}>
              Lihat
            </Button>
          );
        },
      },
    ],
    [onViewDetail]
  );

  return (
    <div className="bg-background border rounded-lg overflow-hidden shadow-sm">
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
