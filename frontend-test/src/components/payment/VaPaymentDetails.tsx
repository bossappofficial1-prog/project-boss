'use client';

import React, { useState } from 'react';
import { Building2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, copyToClipboard } from '@/lib/utils'; // Asumsi ada fungsi ini di utils

interface VaPaymentDetailsProps {
    vaNumber: string;
    totalAmount: number;
}

export function VaPaymentDetails({ vaNumber, totalAmount }: VaPaymentDetailsProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const success = await copyToClipboard(vaNumber);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <p className="text-sm font-medium mb-2">Nomor Virtual Account</p>
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
                    <span className="font-mono font-bold text-lg flex-1">{vaNumber}</span>
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    </Button>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Cara Transfer:
                </h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Buka aplikasi mobile banking atau ATM</li>
                    <li>Pilih menu "Transfer" lalu "Virtual Account"</li>
                    <li>Masukkan nomor Virtual Account: <strong>{vaNumber}</strong></li>
                    <li>Masukkan nominal sebesar: <strong>{formatCurrency(totalAmount)}</strong></li>
                    <li>Ikuti instruksi untuk menyelesaikan pembayaran</li>
                </ol>
            </div>
        </div>
    );
}