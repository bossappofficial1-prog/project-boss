"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Transaction } from "@/lib/apis/transaction";

interface ProofPreviewDialogProps {
  proofUrl: string | null;
  transaction: Transaction | null;
  onOpenChange: (open: boolean) => void;
}

export function ProofPreviewDialog({
  proofUrl,
  transaction,
  onOpenChange,
}: ProofPreviewDialogProps) {
  return (
    <Dialog open={Boolean(proofUrl)} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
        {proofUrl && (
          <div className="relative group">
            <div className="absolute top-4 right-4 z-10">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 rounded-full shadow-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="rounded-lg overflow-hidden bg-background shadow-2xl border border-border/40">
              <div className="p-4 bg-muted/30 border-b border-border/40">
                <p className="text-[10px] font-bold text-muted-foreground mb-1">
                  Bukti Pembayaran
                </p>
                <p className="text-xs font-bold text-foreground truncate">
                  {transaction?.description}
                </p>
              </div>
              <img
                src={proofUrl}
                alt="Bukti Pembayaran"
                className="w-full h-auto max-h-[70vh] object-contain"
              />
              <div className="p-4 flex justify-center">
                <Button asChild variant="outline" size="sm" className="font-bold text-[10px]">
                  <a href={proofUrl} target="_blank" rel="noreferrer">
                    Buka Gambar Penuh
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
