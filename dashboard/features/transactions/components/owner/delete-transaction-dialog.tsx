"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Transaction } from "@/lib/apis/transaction";

interface DeleteTransactionDialogProps {
  transaction: Transaction | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

export function DeleteTransactionDialog({
  transaction,
  onOpenChange,
  onConfirm,
  isPending,
}: DeleteTransactionDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason.trim() || "");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setReason("");
    }
    onOpenChange(open);
  };

  return (
    <ConfirmDialog
      open={Boolean(transaction)}
      onOpenChange={handleOpenChange}
      title="Hapus Transaksi Secara Langsung?"
      description="Aksi ini akan menghapus transaksi secara permanen, mengembalikan stok produk, membatalkan loyalty point, dan mencatat riwayat penghapusan langsung untuk audit trail Owner. Tindakan tidak dapat dibatalkan."
      confirmLabel="Ya, Hapus Langsung"
      cancelLabel="Batal"
      onConfirm={handleConfirm}
      confirmDisabled={isPending}
      confirmVariant="destructive"
    >
      {transaction && (
        <div className="space-y-3 mt-2">
          <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-1.5 font-sans">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-medium">
                Deskripsi
              </span>
              <span className="font-semibold text-foreground truncate max-w-50">
                {transaction.description}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-medium">
                Total Pembayaran
              </span>
              <span className="font-bold text-foreground">
                Rp {new Intl.NumberFormat("id-ID").format(transaction.amount)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-medium">Metode</span>
              <span className="font-semibold text-foreground uppercase text-[10px]">
                {transaction.manualMethod ||
                  transaction.paymentMethod ||
                  "Online"}
              </span>
            </div>
          </div>
          <div className="space-y-1.5 font-sans">
            <label className="text-xs font-semibold text-foreground">
              Alasan Penghapusan <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Masukkan alasan penghapusan transaksi ini..."
              className="text-sm resize-none border-border/60 focus:border-primary/40 focus:ring-primary/10 rounded-md"
              rows={3}
            />
          </div>
        </div>
      )}
    </ConfirmDialog>
  );
}
