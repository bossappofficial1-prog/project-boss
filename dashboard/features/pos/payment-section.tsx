"use client";

import React from "react";
import { Banknote, CreditCard, QrCode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { generateDynamicQRIS, getQrisQrCodeUrl } from "@/lib/qris";
import { QRCodeSVG } from "qrcode.react";

export type PaymentMethodType = "cash" | "qris" | "none";

interface PaymentSectionProps {
  method: PaymentMethodType;
  onMethodChange: (method: PaymentMethodType) => void;
  total: number;
  cashReceived: number;
  onCashReceivedChange: (value: number) => void;
  qrisImageUrl?: string | null;
  qrisString?: string | null;
  isLoadingQris?: boolean;
}

const fmt = new Intl.NumberFormat("id-ID");

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

export function PaymentSection({
  method,
  onMethodChange,
  total,
  cashReceived,
  onCashReceivedChange,
  qrisImageUrl,
  qrisString,
  isLoadingQris,
}: PaymentSectionProps) {
  const change = cashReceived - total;
  const [showQrisModal, setShowQrisModal] = React.useState(false);

  const isDynamic = !!qrisString;
  const dynamicQrisString = React.useMemo(() => {
    if (qrisString) {
      return generateDynamicQRIS(qrisString, total);
    }
    return "";
  }, [qrisString, total]);

  const finalQrisImageUrl = React.useMemo(() => {
    if (qrisString) {
      return getQrisQrCodeUrl(dynamicQrisString);
    }
    return qrisImageUrl;
  }, [qrisString, dynamicQrisString, qrisImageUrl]);

  const handleQrisMethodChange = () => {
    onMethodChange("qris");
    if (finalQrisImageUrl) {
      setShowQrisModal(true);
    }
  };

  const handleQuickAmount = (amount: number) => {
    onCashReceivedChange(amount);
  };

  const handleExactAmount = () => {
    onCashReceivedChange(total);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <Label className="text-sm font-medium">Metode Pembayaran</Label>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onMethodChange("cash")}
          className={cn(
            "flex items-center gap-2 rounded-md border p-2.5 text-sm font-medium transition-all",
            method === "cash"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground",
          )}
        >
          <Banknote className="h-4 w-4" />
          Cash
        </button>
        <button
          type="button"
          onClick={handleQrisMethodChange}
          className={cn(
            "flex items-center gap-2 rounded-md border p-2.5 text-sm font-medium transition-all",
            method === "qris"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground",
          )}
        >
          <QrCode className="h-4 w-4" />
          QRIS
        </button>

        {/* Placeholder untuk metode tambahan di masa depan */}
        <button
          type="button"
          disabled
          className="flex items-center gap-2 rounded-md border border-dashed border-border p-2.5 text-sm text-muted-foreground/50"
        >
          <CreditCard className="h-4 w-4" />
          Lainnya (segera)
        </button>
      </div>

      {method === "cash" && (
        <div className="space-y-2.5">
          <div>
            <Label
              htmlFor="cashReceived"
              className="text-xs text-muted-foreground"
            >
              Nominal Diterima
            </Label>
            <Input
              id="cashReceived"
              type="number"
              min={0}
              value={cashReceived || ""}
              onChange={(e) => onCashReceivedChange(Number(e.target.value))}
              placeholder="0"
              className="mt-1"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={handleExactAmount}
              className="rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              Uang Pas
            </button>
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleQuickAmount(amount)}
                className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                {fmt.format(amount)}
              </button>
            ))}
          </div>

          {cashReceived > 0 && (
            <div
              className={cn(
                "flex items-center justify-between rounded-md p-3 text-sm font-semibold",
                change >= 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              <span>{change >= 0 ? "Kembalian" : "Kurang"}</span>
              <span>Rp {fmt.format(Math.abs(change))}</span>
            </div>
          )}
        </div>
      )}

      {method === "qris" && (
        <div className="space-y-3">
          {isLoadingQris && (
            <div className="flex h-48 items-center justify-center rounded-md border border-border bg-muted/20">
              <p className="text-sm text-muted-foreground">Memuat QRIS...</p>
            </div>
          )}
          {!isLoadingQris && finalQrisImageUrl && (
            <div
              className="flex cursor-pointer flex-col items-center gap-2 rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/50"
              onClick={() => setShowQrisModal(true)}
            >
              <p className="text-xs text-muted-foreground">
                Tap untuk perbesar · Scan QR berikut untuk pembayaran
              </p>
              {isDynamic ? (
                <div className="flex items-center justify-center bg-white p-3 rounded-lg border border-border h-56 w-56">
                  <QRCodeSVG
                    value={dynamicQrisString}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              ) : (
                <div className="relative h-56 w-56">
                  <Image
                    src={finalQrisImageUrl!}
                    alt="QR Code Outlet"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
              <p className="text-center text-sm font-semibold text-foreground flex flex-col items-center">
                <span>Total: Rp {fmt.format(total)}</span>
              </p>
            </div>
          )}
          {!isLoadingQris && !finalQrisImageUrl && (
            <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-yellow-300 bg-yellow-50 p-4 text-center dark:border-yellow-600/40 dark:bg-yellow-500/10">
              <QrCode className="h-8 w-8 text-yellow-500" />
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                QRIS belum diatur
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500">
                Upload gambar QRIS outlet terlebih dahulu di halaman pengaturan.
              </p>
            </div>
          )}
        </div>
      )}

      {/* QRIS Popup Modal */}
      <Dialog open={showQrisModal} onOpenChange={setShowQrisModal}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Pembayaran QRIS
            </DialogTitle>
            <DialogDescription>
              Scan QR code berikut untuk melakukan pembayaran
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 flex flex-col justify-center w-full items-center py-2">
            <div className="flex items-center justify-center bg-white p-4 border-2 rounded-lg h-80 w-80">
              {isDynamic ? (
                <QRCodeSVG
                  value={dynamicQrisString}
                  size={260}
                  level="H"
                  includeMargin={true}
                />
              ) : (
                <div className="relative h-full w-full">
                  <Image
                    src={finalQrisImageUrl!}
                    alt="QR Code Outlet"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
            </div>
            <p className="text-center text-xl font-semibold text-foreground flex flex-col items-center gap-1.5">
              <span>Total: Rp {fmt.format(total)}</span>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
