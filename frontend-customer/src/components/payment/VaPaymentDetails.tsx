'use client';

import React, { useState } from 'react';
import { Building2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, copyToClipboard } from '@/lib/utils';
import { useTranslations } from '@/hooks/useI18n';

interface VaPaymentDetailsProps {
    vaNumber: string;
    totalAmount: number;
}

export function VaPaymentDetails({ vaNumber, totalAmount }: VaPaymentDetailsProps) {
    const [copied, setCopied] = useState(false);
    const t = useTranslations("paymentComponents");

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
                <p className="text-sm font-medium mb-2">{t("vaPayment.vaNumber")}</p>
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
                    <span className="font-mono font-bold text-lg flex-1">{vaNumber}</span>
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    </Button>
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <Building2 className="w-4 h-4" />
                    {t("vaPayment.title")}
                </h4>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                    <li>{t("vaPayment.steps.1")}</li>
                    <li>{t("vaPayment.steps.2")}</li>
                    <li>{t("vaPayment.steps.3")} <strong>{vaNumber}</strong></li>
                    <li>{t("vaPayment.steps.4")} <strong>{formatCurrency(totalAmount)}</strong></li>
                    <li>{t("vaPayment.instructions")}</li>
                </ol>
            </div>
        </div>
    );
}