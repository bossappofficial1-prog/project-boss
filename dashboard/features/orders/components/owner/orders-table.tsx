import { useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Order } from "@/hooks/use-orders-react-query";

interface OrdersTableProps {
  data: Order[];
  isLoading: boolean;
  isRefetching: boolean;
  searchKey: string;
  onSearchChange: (value: string) => void;
  page: number;
  limit: number;
  totalItems: number;
  onPaginationChange: (params: { page: number; limit: number }) => void;
  onViewDetail: (order: Order) => void;
}

export default function OrdersTable({
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
}: OrdersTableProps) {
  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "receiptNumber",
        header: "No. Pesanan",
        cell: ({ row }) => {
          return <div className="font-semibold">{row.original.id}</div>;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Waktu Transaksi",
        cell: ({ row }) => {
          try {
            return (
              <span className="text-muted-foreground whitespace-nowrap">
                {format(new Date(row.original.createdAt), "dd MMM yy, HH:mm", { locale: id })}
              </span>
            );
          } catch {
            return "-";
          }
        },
      },
      {
        accessorKey: "customerName",
        header: "Pelanggan",
        cell: ({ row }) => {
          const name = row.original.customerName || "-";
          return <div className="font-medium">{name}</div>;
        },
      },
      {
        accessorKey: "orderStatus",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.orderStatus;

          let variant: "default" | "secondary" | "destructive" | "outline" | "active" = "outline";
          let label: string = status;

          if (status === "AWAITING_PAYMENT") {
            variant = "secondary";
            label = "Menunggu Bayar";
          } else if (status === "COMPLETED") {
            variant = "active";
            label = "Selesai Keseluruhan";
          } else if (status === "CANCELLED") {
            variant = "destructive";
            label = "Batal";
          } else if (status === "PROCESSING") {
            variant = "default";
            label = "Diproses";
          } else if (status === "CONFIRMED") {
            variant = "active";
            label = "Dikonfirmasi";
          } else if (status === "READY") {
            variant = "active";
            label = "Siap Ambil";
          } else if (status === "ON_GOING") {
            variant = "active";
            label = "Sedang Jalan";
          }

          return <Badge variant={variant as any}>{label}</Badge>;
        },
      },
      {
        accessorKey: "paymentStatus",
        header: "Pembayaran",
        cell: ({ row }) => {
          const status = row.original.paymentStatus;

          let variant: "default" | "secondary" | "destructive" | "outline" | "active" = "outline";
          let label: string = status;

          if (status === "SUCCESS") {
            variant = "active";
            label = "Berhasil";
          } else if (status === "PENDING") {
            variant = "secondary";
            label = "Tertunda";
          } else if (status === "AWAITING_VERIFICATION") {
            variant = "secondary";
            label = "Verifikasi";
          } else if (status === "FAILED") {
            variant = "destructive";
            label = "Gagal";
          } else if (status === "EXPIRED") {
            variant = "destructive";
            label = "Kadaluarsa";
          } else if (status === "REFUNDED") {
            variant = "outline";
            label = "Dikembalikan (Refund)";
          }

          return (
            <div className="flex flex-col gap-1 items-start">
              <Badge variant={variant as any}>{label}</Badge>
            </div>
          );
        },
      },
      {
        id: "tax",
        header: "Pajak",
        cell: ({ row }) => {
          const tax = (row.original as any).taxAmount ?? 0;
          return tax > 0 ? (
            <span className="font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              }).format(tax)}
            </span>
          ) : (
            <span className="text-muted-foreground/40">—</span>
          );
        },
      },
      {
        accessorKey: "totalAmount",
        header: "Total",
        cell: ({ row }) => {
          const amount = row.original.totalAmount || 0;
          return (
            <div className="font-bold whitespace-nowrap">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              }).format(amount)}
            </div>
          );
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
    <DataTable
      columns={columns}
      data={data}
      searchDebounceMs={300}
      isLoading={isLoading}
      isRefreshing={isRefetching}
      serverSideSearch={true}
      searchValue={searchKey}
      onSearchChange={onSearchChange}
      pagination={true}
      serverSidePagination={true}
      totalItems={totalItems}
      serverPage={page}
      serverLimit={limit}
      onPaginationChange={onPaginationChange}
    />
  );
}
