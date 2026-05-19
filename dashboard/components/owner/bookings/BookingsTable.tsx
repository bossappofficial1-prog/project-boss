import { useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingListItem } from "@/hooks/use-booking";

interface BookingsTableProps {
  data: BookingListItem[];
  isLoading: boolean;
  isRefetching: boolean;
  searchKey: string;
  onSearchChange: (value: string) => void;
  page: number;
  limit: number;
  totalItems: number;
  onPaginationChange: (params: { page: number; limit: number }) => void;
}

export default function BookingsTable({
  data,
  isLoading,
  isRefetching,
  searchKey,
  onSearchChange,
  page,
  limit,
  totalItems,
  onPaginationChange,
}: BookingsTableProps) {
  const columns = useMemo<ColumnDef<BookingListItem>[]>(
    () => [
      {
        accessorKey: "serviceName",
        header: "Layanan",
        cell: ({ row }) => {
          return (
            <div>
              <div className="font-medium">{row.original.serviceName}</div>
              <div className="text-xs text-muted-foreground">{row.original.providerName}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "date",
        header: "Tanggal & Waktu",
        cell: ({ row }) => {
          try {
            const date = format(new Date(row.original.date), "dd MMM yy", { locale: id });
            const start = format(new Date(row.original.startTime), "HH:mm");
            const end = format(new Date(row.original.endTime), "HH:mm");
            return (
              <div>
                <div className="font-medium">{date}</div>
                <div className="text-xs text-muted-foreground">{start} - {end}</div>
              </div>
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
          const phone = row.original.customerPhone;
          return (
            <div>
              <div className="font-medium">{name}</div>
              {phone && <div className="text-xs text-muted-foreground">{phone}</div>}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;

          let variant: "default" | "secondary" | "destructive" | "outline" | "active" = "outline";
          let label: string = status;

          if (status === "BOOKED") {
            variant = "active";
            label = "Dibooking";
          } else if (status === "BLOCKED") {
            variant = "destructive";
            label = "Diblokir";
          } else if (status === "AVAILABLE") {
            variant = "secondary";
            label = "Tersedia";
          }

          return <Badge variant={variant as any}>{label}</Badge>;
        },
      },
      {
        accessorKey: "orderStatus",
        header: "Status Pesanan",
        cell: ({ row }) => {
          const status = row.original.orderStatus;
          if (!status) return <span className="text-muted-foreground">-</span>;

          let variant: "default" | "secondary" | "destructive" | "outline" | "active" = "outline";
          let label: string = status;

          if (status === "COMPLETED") {
            variant = "active";
            label = "Selesai";
          } else if (status === "CANCELLED") {
            variant = "destructive";
            label = "Batal";
          } else if (status === "PROCESSING") {
            variant = "default";
            label = "Diproses";
          } else if (status === "CONFIRMED") {
            variant = "active";
            label = "Dikonfirmasi";
          } else if (status === "AWAITING_PAYMENT") {
            variant = "secondary";
            label = "Menunggu Bayar";
          }

          return <Badge variant={variant as any}>{label}</Badge>;
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
        id: "viewOrder",
        header: "Aksi",
        cell: ({ row }) => {
          const orderId = row.original.orderId;
          if (!orderId) return <span className="text-muted-foreground">-</span>;

          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/owner/orders?orderId=${orderId}`, "_blank")}
            >
              Lihat Pesanan
            </Button>
          );
        },
      },
    ],
    []
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
