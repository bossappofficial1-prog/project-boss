'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { copyToClipboard, formatCurrency } from '@/lib/utils';
import { useTranslations } from '@/hooks/useI18n';
import { PaymentDetailManual, PaymentManualInstruction } from '@/types/payment-detail';
import { Building2, Copy, Smartphone, Check } from 'lucide-react';
import { ImageRender } from '@/components/shared/Image';

interface ManualPaymentDetailsProps {
    manual: PaymentDetailManual;
    totalAmount: number;
}

function resolveInstructions(manual: PaymentDetailManual): PaymentManualInstruction | undefined {
    return manual.instructions ?? manual.intruction ?? undefined;
}

export function ManualPaymentDetails({ manual, totalAmount }: ManualPaymentDetailsProps) {
    const t = useTranslations('paymentDetail');
    const [copied, setCopied] = useState(false);

    const instructions = useMemo(() => resolveInstructions(manual), [manual]);
    const bankAccount = instructions?.bankAccount;
    const manualType = (instructions?.manualType ?? manual.type)?.toLowerCase();
    const isQris = Boolean(
        instructions?.qrImageUrl &&
        (manualType ? manualType.includes('qris') : false)
    );

    if (!instructions) {
        return null;
    }

    const handleCopy = async (value?: string) => {
        if (!value) return;
        const success = await copyToClipboard(value);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Card className="gap-0">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                    {t('manual.title')}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">

                {/* Outlet */}
                <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                        {t('manual.outlet')}
                    </p>

                    <p className="font-semibold leading-tight">
                        {instructions.outletName ?? '-'}
                    </p>

                    {instructions.businessName && (
                        <p className="text-xs text-muted-foreground">
                            {instructions.businessName}
                        </p>
                    )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
                    <span className="text-xs font-medium text-muted-foreground">
                        {t('manual.total')}
                    </span>

                    <span className="text-sm font-semibold text-primary">
                        {formatCurrency(totalAmount)}
                    </span>
                </div>

                {/* QRIS */}
                {isQris && instructions.qrImageUrl && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            <Smartphone className="h-4 w-4" />
                            {t('manual.qrisTitle')}
                        </div>

                        <div className="mx-auto flex max-w-[220px] items-center justify-center rounded-xl border bg-background p-3">
                            <ImageRender
                                src={instructions.qrImageUrl}
                                alt="QRIS"
                                className="h-auto w-full rounded-lg object-contain"
                            />
                        </div>

                        <p className="text-xs text-muted-foreground">
                            {t('manual.qrisDescription')}
                        </p>
                    </div>
                )}

                {/* Bank */}
                {bankAccount && (bankAccount.bankName || bankAccount.accountNumber) && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            <Building2 className="h-4 w-4" />
                            {t('manual.bankTitle')}
                        </div>

                        <div className="space-y-2 rounded-lg border bg-muted/20 p-3 text-sm">

                            {bankAccount.bankName && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        {t('manual.bank')}
                                    </span>

                                    <span className="font-semibold">
                                        {bankAccount.bankName}
                                    </span>
                                </div>
                            )}

                            {bankAccount.accountNumber && (
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            {t('manual.accountNumber')}
                                        </p>

                                        <p className="font-semibold">
                                            {bankAccount.accountNumber}
                                        </p>
                                    </div>

                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-8 w-8"
                                        onClick={() => handleCopy(bankAccount.accountNumber)}
                                    >
                                        {copied
                                            ? <Check className="h-4 w-4 text-green-600" />
                                            : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            )}

                            {bankAccount.accountHolder && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        {t('manual.accountName')}
                                    </span>

                                    <span className="font-semibold">
                                        {bankAccount.accountHolder}
                                    </span>
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {/* Note */}
                {instructions.note && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/70 dark:bg-amber-950/20 dark:text-amber-200">
                        <p className="mb-1 flex items-center gap-2 font-medium">
                            <Smartphone className="h-4 w-4" />
                            {t('manual.note')}
                        </p>

                        <p className="leading-relaxed">
                            {instructions.note}
                        </p>
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
