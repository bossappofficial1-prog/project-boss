'use client';

import React, { useEffect, useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Receipt,
    Home,
    Clock,
    Store
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { useTranslations } from '@/hooks/useI18n';
import { SuccessState } from '@/components/Base';
import { ImportantInformationCard } from '@/components/payment/ImportantInformationCard';
import { CustomerInfo, PaymentMethod, PaymentResponse } from '@/types';
import { PaymentService } from '@/services/paymentService';

export default function PaymentSuccess() {
    const { items } = useCart();
    const [paymentInfo, setPaymentInfo] = useState<PaymentResponse & { customerInfo: CustomerInfo; selectedPaymentMethod: PaymentMethod } | null>(null);
    const router = useRouter();
    const t = useTranslations("paymentSuccess");

    useEffect(() => {
        const paymentInfo = PaymentService.getPaymentInformation()

        if (paymentInfo) {
            setPaymentInfo(paymentInfo);
        }
    }, []);

    const handleBackToHome = () => {
        router.push('/');
    };

    const handleViewReceipt = () => {
        router.push('/orders');
    };

    return (
        <>
            <SuccessState
                title={t("orderSuccessful")}
                description={t("orderProcessing")}
            />

            <div className='space-y-4'>
                {/* Payment Info */}
                {paymentInfo && (
                    <Card className='p-0'>
                        <CardContent className="p-6 space-y-4">
                            <div className="text-center border-b pb-4">
                                <p className="text-sm text-muted-foreground">{t("totalPayment")}</p>
                                <p className="text-3xl font-bold text-primary">
                                    {formatCurrency(Number(paymentInfo.gross_amount) || 0)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Status: {paymentInfo.status_message} ({paymentInfo.status_code})
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Main Payment Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("paymentMethod")}</p>
                                        <p className="font-semibold text-sm">{paymentInfo.selectedPaymentMethod.name}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Order ID</p>
                                        <p className="font-semibold text-sm">{paymentInfo.order_id}</p>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div className="border-t pt-4">
                                    <h3 className="font-medium text-sm mb-3 text-muted-foreground">Customer Information</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">{t("customerName")}</span>
                                            <span className="font-medium text-sm">{paymentInfo.customerInfo.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">{t("phoneNumber")}</span>
                                            <span className="font-medium text-sm">{paymentInfo.customerInfo.phone}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Transaction Details */}
                                <div className="border-t pt-4">
                                    <h3 className="font-medium text-sm mb-3 text-muted-foreground">{t("transactionDetails")}</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">{t("transactionId")}</span>
                                            <span className="font-medium text-xs font-mono">{paymentInfo.transaction_id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">{t("paymentTime")}</span>
                                            <span className="font-medium text-sm">
                                                {paymentInfo.payment_amounts?.[0]?.paid_at
                                                    ? new Date(paymentInfo.payment_amounts[0].paid_at).toLocaleString('id-ID')
                                                    : new Date(paymentInfo.transaction_time).toLocaleString('id-ID')
                                                }
                                            </span>
                                        </div>
                                        {paymentInfo.va_numbers && paymentInfo.va_numbers.length > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">{t("vaNumber")}</span>
                                                <span className="font-medium text-xs font-mono">{paymentInfo.va_numbers[0].va_number}</span>
                                            </div>
                                        )}
                                        {paymentInfo.payment_type && (
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">{t("paymentType")}</span>
                                                <span className="font-medium text-sm capitalize">{paymentInfo.payment_type}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Next Steps */}
                                <div className="border-t pt-4">
                                    <h3 className="font-medium text-sm mb-3 text-muted-foreground">{t("whatsNext")}</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-start gap-2">
                                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                            <p className="text-muted-foreground">{t("orderBeingProcessed")}</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                            <p className="text-muted-foreground">{t("confirmationSms")}</p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                            <p className="text-muted-foreground">{t("trackOrderRealtime")}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Processing Time */}
                                <div className="border-t pt-4">
                                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-blue-600" />
                                            <h3 className="font-medium text-sm text-blue-800">{t("estimatedProcessing")}</h3>
                                        </div>
                                        <p className="text-sm text-blue-700">
                                            {t("orderReadyTime")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Status Info */}
                <Card className="border-orange-200/20 p-0">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-orange-600" />
                            <div>
                                <p className="font-medium text-orange-800">{t("statusWaiting")}</p>
                                <p className="text-sm text-orange-600">
                                    {t("statusDescription")}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Button
                        size="lg"
                        className="w-full h-12"
                        onClick={handleViewReceipt}
                    >
                        <Receipt className="w-4 h-4 mr-2" />
                        {t("viewOrderDetails")}
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full h-12"
                        onClick={handleBackToHome}
                    >
                        <Home className="w-4 h-4 mr-2" />
                        {t("backToHome")}
                    </Button>
                </div>

                <ImportantInformationCard type='success' />
            </div>
        </>
    );
}
