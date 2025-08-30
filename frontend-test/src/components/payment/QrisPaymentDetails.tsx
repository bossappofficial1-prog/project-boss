'use client';

import React from 'react';
import { Smartphone } from 'lucide-react';

interface QrisPaymentDetailsProps {
    qrCodeUrl: string;
    paymentMethodName: string;
}

export function QrisPaymentDetails({ qrCodeUrl, paymentMethodName }: QrisPaymentDetailsProps) {
    return (
        <div className="space-y-4">
            <div className="w-48 h-48 mx-auto bg-white border-2 border-dashed rounded-xl flex items-center justify-center p-2">
                {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code" className="w-full h-full" />
                ) : (
                    <span className="text-sm text-muted-foreground">QR not available</span>
                )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Cara Pembayaran:
                </h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Buka aplikasi e-wallet atau mobile banking Anda</li>
                    <li>Pilih menu "Scan" atau "Bayar dengan QRIS"</li>
                    <li>Scan QR Code di atas</li>
                    <li>Pastikan nominal pembayaran sudah sesuai</li>
                    <li>Konfirmasi dan selesaikan pembayaran</li>
                </ol>
            </div>
        </div>
    );
}