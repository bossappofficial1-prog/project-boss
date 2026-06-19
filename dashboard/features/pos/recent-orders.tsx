"use client";

import React from "react";
import { Clock, Printer, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { PosV2RecentOrder } from "@/lib/apis/pos-v2";
import { usePrint } from "@/hooks/use-print";
import { useRequestDeleteTransaction } from "@/hooks/api/use-transaction-delete";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { gooeyToast } from "goey-toast";

interface RecentOrdersProps {
  orders: PosV2RecentOrder[] | undefined;
  isLoading: boolean;
}

const fmt = new Intl.NumberFormat("id-ID");
const timeFmt = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
});

export function RecentOrders({ orders, isLoading }: RecentOrdersProps) {
  const [printingId, setPrintingId] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<PosV2RecentOrder | null>(null);
  const [deleteReason, setDeleteReason] = React.useState("");
  const { handlePrintReceipt } = usePrint();
  const requestDelete = useRequestDeleteTransaction();

  const handlePrint = async (orderId: string) => {
    setPrintingId(orderId);
    await handlePrintReceipt(orderId);
    setPrintingId(null);
  };

  const handleDeleteClick = (order: PosV2RecentOrder) => {
    setSelectedOrder(order);
    setDeleteReason("");
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedOrder?.transactionId) {
      gooeyToast.error("Transaksi tidak ditemukan");
      return;
    }

    requestDelete.mutate(
      { transactionId: selectedOrder.transactionId, reason: deleteReason.trim() || undefined },
      {
        onSuccess: () => {
          gooeyToast.success("Permintaan penghapusan dikirim ke Owner");
          setDeleteDialogOpen(false);
          setSelectedOrder(null);
          setDeleteReason("");
        },
        onError: (error: any) => {
          gooeyToast.error(error?.response?.data?.message || error?.message || "Gagal mengirim permintaan penghapusan");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-md" />
        ))}
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-muted-foreground uppercase font-medium border border-dashed border-border rounded-md">
        Belum ada transaksi hari ini
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 overflow-y-auto pr-1">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center gap-3 rounded-md border border-border bg-card p-2.5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">
                  {order.customerName}
                </p>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                  <Clock className="h-3 w-3" />
                  {timeFmt.format(new Date(order.createdAt))}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {order.itemsSummary} ({order.itemCount} item)
              </p>
            </div>
            <p className="whitespace-nowrap text-sm font-semibold text-foreground">
              Rp {fmt.format(order.totalAmount)}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              disabled={printingId === order.id}
              onClick={() => handlePrint(order.id)}
            >
              <Printer className="h-3.5 w-3.5" />
            </Button>
            {order.transactionId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => handleDeleteClick(order)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setSelectedOrder(null);
            setDeleteReason("");
          }
        }}
        title="Ajukan Penghapusan Transaksi"
        description="Permintaan ini akan dikirim ke Owner untuk disetujui. Transaksi hanya akan dihapus setelah Owner menyetujui."
        confirmLabel="Kirim Permintaan"
        cancelLabel="Batal"
        onConfirm={handleDeleteConfirm}
        confirmDisabled={requestDelete.isPending}
        confirmVariant="destructive"
      >
        <div className="space-y-3 mt-2">
          {selectedOrder && (
            <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Pelanggan</span>
                <span className="font-medium text-foreground">{selectedOrder.customerName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium text-foreground">Rp {fmt.format(selectedOrder.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Item</span>
                <span className="font-medium text-foreground">{selectedOrder.itemsSummary}</span>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Alasan penghapusan <span className="text-muted-foreground">(opsional)</span>
            </label>
            <Textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Contoh: transaksi duplikat, salah input, dll."
              className="text-sm resize-none"
              rows={3}
            />
          </div>
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-700">
              Stok produk akan dikembalikan setelah Owner menyetujui penghapusan.
            </p>
          </div>
        </div>
      </ConfirmDialog>
    </>
  );
}
