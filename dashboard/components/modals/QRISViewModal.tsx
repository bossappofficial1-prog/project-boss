"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { outletApi } from "@/lib/apis/outlet";

interface QRISViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId?: string;
  outletName?: string;
  qrisImageUrl?: string | null;
  showActions?: boolean;
  onQRISUpdate?: () => void;
}

export default function QRISViewModal({
  open,
  onOpenChange,
  outletId,
  outletName,
  qrisImageUrl,
  showActions = false,
  onQRISUpdate,
}: QRISViewModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [qrisData, setQrisData] = useState<{
    outletId: string;
    outletName: string;
    qrisImageUrl: string | null;
  } | null>(null);

  // Fetch QRIS data jika hanya outletId yang diberikan
  useEffect(() => {
    if (open && outletId && !qrisImageUrl) {
      fetchQRISData();
    } else if (open && qrisImageUrl) {
      setQrisData({
        outletId: outletId || "",
        outletName: outletName || "",
        qrisImageUrl: qrisImageUrl,
      });
    }
  }, [open, outletId, qrisImageUrl, outletName]);

  const fetchQRISData = async () => {
    if (!outletId) return;

    setIsLoading(true);
    try {
      const data = await outletApi.getQRIS(outletId);
      setQrisData(data);
    } catch (error: any) {
      console.error("Error fetching QRIS:", error);
      toast.error(error.message || "Gagal memuat QRIS");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">QRIS Payment</DialogTitle>
          <DialogDescription>
            {qrisData?.outletName || outletName || "Outlet"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Memuat QRIS...
                </p>
              </div>
            </div>
          ) : qrisData?.qrisImageUrl ? (
            <>
              {/* QRIS Image Display */}
              <div className="bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="relative w-full max-w-100 mx-auto aspect-square bg-white rounded-lg shadow-lg p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrisData.qrisImageUrl}
                    alt="QRIS"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Info Text */}
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                      Cara Pembayaran:
                    </p>
                    <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                      <li>Buka aplikasi mobile banking atau e-wallet Anda</li>
                      <li>Pilih menu Scan QR atau QRIS</li>
                      <li>Scan kode QR di atas</li>
                      <li>Masukkan nominal pembayaran</li>
                      <li>Konfirmasi pembayaran</li>
                    </ol>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                QRIS Belum Tersedia
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {showActions
                  ? "Outlet ini belum memiliki QRIS. Upload QRIS untuk menerima pembayaran."
                  : "Outlet ini belum memiliki QRIS. Hubungi pemilik outlet untuk informasi lebih lanjut."}
              </p>
              {showActions && outletId && (
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    // Trigger upload modal if needed
                    onQRISUpdate?.();
                  }}
                  className="bg-red-gradient hover:bg-red-gradient-dark"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Upload QRIS
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
