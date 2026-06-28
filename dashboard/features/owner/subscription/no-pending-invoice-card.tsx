"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Loader2, CheckCircle2, Sparkles } from "lucide-react";

interface Props {
  onRenew: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function NoPendingInvoiceCard({ onRenew, disabled, loading }: Props) {
  return (
    <Card className="gap-0 py-0 rounded-md overflow-hidden border-emerald-500/20 bg-emerald-500/5 shadow-sm border">
      <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-md bg-background text-emerald-600 flex items-center justify-center border border-emerald-500/20 shadow-sm">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-black tracking-tight text-foreground">
                Status Pembayaran Aman
              </p>
              <Sparkles className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Semua tagihan telah diselesaikan. Paket Anda aktif sepenuhnya
              tanpa kendala administrasi.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full md:w-auto  gap-2  border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 shadow-none transition-all active:scale-95"
          onClick={onRenew}
          disabled={disabled}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CreditCard className="h-3.5 w-3.5" />
          )}
          Buat Invoice Perpanjangan
        </Button>
      </CardContent>
    </Card>
  );
}
