"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ShoppingCart, ClipboardList, Eye, Filter } from "lucide-react";

import { useOutletContext } from "@/components/providers/OutletProvider";
import { DataTable } from "@/components/ui/data-table";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePurchaseOrders } from "@/hooks/api/use-purchase-orders";
import { PurchaseOrderDetailDialog } from "@/components/owner/purchase-orders/PurchaseOrderDetailDialog";
import type { PurchaseOrder, PurchaseOrderStatus } from "@/lib/apis/purchase-order";

function formatIdr(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

const STATUS_OPTIONS: { label: string; value: PurchaseOrderStatus | "ALL" }[] = [
  { label: "Semua Status", value: "ALL" },
  { label: "Draf", value: "DRAFT" },
  { label: "Terkirim", value: "SENT" },
  { label: "Selesai", value: "COMPLETED" },
  { label: "Dibatalkan", value: "CANCELLED" },
];

function getStatusBadge(status: PurchaseOrderStatus) {
  switch (status) {
    case "DRAFT":
      return (
        <Badge
          variant="outline"
          className="font-bold text-[9px] uppercase tracking-wider bg-amber-500/10 text-amber-600 border-amber-500/20"
        >
          Draf
        </Badge>
      );
    case "SENT":
      return (
        <Badge
          variant="outline"
          className="font-bold text-[9px] uppercase tracking-wider bg-primary/10 text-primary border-primary/20"
        >
          Terkirim
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge
          variant="outline"
          className="font-bold text-[9px] uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
        >
          Selesai
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge
          variant="outline"
          className="font-bold text-[9px] uppercase tracking-wider bg-destructive/10 text-destructive border-destructive/20"
        >
          Dibatalkan
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function PurchaseOrdersPage() {
  const { selectedOutletId: outletId } = useOutletContext();

  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "ALL">("ALL");

  const { data, isLoading, isFetching, refetch } = usePurchaseOrders(outletId ?? undefined, {
    status: statusFilter === "ALL" ? undefined : statusFilter,
    search: search || undefined,
    limit: 50,
  });

  const purchaseOrders = data?.purchaseOrders ?? [];

  const handleOpenDetail = (po: PurchaseOrder) => {
    setSelectedPoId(po.id);
    setIsDialogOpen(true);
  };

  // Stats summary
  const draftCount = purchaseOrders.filter((po) => po.status === "DRAFT").length;
  const sentCount = purchaseOrders.filter((po) => po.status === "SENT").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title="Pemesanan Barang (PO)"
        description="Kelola Purchase Order, pantau status pengiriman supplier, dan konfirmasi penerimaan stok barang otomatis."
        actions={
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PurchaseOrderStatus | "ALL")}>
            <SelectTrigger className="h-10 text-xs font-semibold w-[170px]">
              <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Summary Cards */}
      {!isLoading && (draftCount > 0 || sentCount > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {draftCount > 0 && (
            <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/15 rounded-lg p-3">
              <div className="h-8 w-8 rounded-md bg-amber-500/15 flex items-center justify-center shrink-0">
                <ClipboardList className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Draf Menunggu Review</p>
                <p className="text-lg font-black text-amber-600">{draftCount} PO</p>
              </div>
            </div>
          )}
          {sentCount > 0 && (
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/15 rounded-lg p-3">
              <div className="h-8 w-8 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Menunggu Konfirmasi Terima</p>
                <p className="text-lg font-black text-primary">{sentCount} PO</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table — search & refresh sudah built-in di DataTable */}
      <DataTable
        isLoading={isLoading}
        isRefreshing={isFetching && !isLoading}
        onRefresh={refetch}
        data={purchaseOrders}
        serverSideSearch
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nomor PO atau nama supplier..."
        emptyMessage="Belum ada Purchase Order. Stok akan otomatis membuat draf PO saat stok mencapai batas minimum."
        columns={[
          {
            accessorKey: "poNumber",
            header: "Nomor PO",
            cell: ({ row }) => (
              <div className="flex flex-col">
                <span className="font-mono font-bold text-xs text-foreground/90">
                  {row.original.poNumber}
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  {format(new Date(row.original.createdAt), "dd MMM yyyy", { locale: localeId })}
                </span>
              </div>
            ),
          },
          {
            accessorKey: "supplier",
            header: "Supplier",
            cell: ({ row }) => (
              <div className="flex flex-col max-w-[200px]">
                <span className="font-semibold text-xs text-foreground truncate">
                  {row.original.supplier.name}
                </span>
                {row.original.supplier.phone && (
                  <span className="text-[10px] text-muted-foreground/60 truncate">
                    {row.original.supplier.phone}
                  </span>
                )}
              </div>
            ),
          },
          {
            accessorKey: "outlet",
            header: "Outlet",
            cell: ({ row }) => (
              <span className="text-xs font-medium text-muted-foreground">
                {row.original.outlet.name}
              </span>
            ),
          },
          {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => getStatusBadge(row.original.status),
          },
          {
            accessorKey: "items",
            header: "Jml Item",
            cell: ({ row }) => (
              <span className="text-xs font-bold text-foreground tabular-nums">
                {row.original.items?.length ?? "-"}
              </span>
            ),
          },
          {
            accessorKey: "totalEstimate",
            header: "Estimasi Total",
            cell: ({ row }) => (
              <span className="text-xs font-bold text-foreground tabular-nums">
                {formatIdr(row.original.totalEstimate)}
              </span>
            ),
          },
          {
            id: "actions",
            header: "",
            cell: ({ row }) => (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => handleOpenDetail(row.original)}
                title="Lihat Detail"
              >
                <Eye className="h-4 w-4" />
              </Button>
            ),
          },
        ]}
      />

      {/* Detail Dialog */}
      <PurchaseOrderDetailDialog
        poId={selectedPoId}
        isOpen={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedPoId(null);
        }}
      />
    </div>
  );
}
