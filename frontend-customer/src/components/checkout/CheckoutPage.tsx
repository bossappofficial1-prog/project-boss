'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Store,
    Gift
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CheckoutService } from '@/services/checkout';
import { CheckoutProps } from '@/types/checkout';
import PaymentMethodsList from './PaymentMethodsList';
import { formatCurrency } from '@/lib/utils';
import { PaymentMethod } from '@/types';
import { useTranslations } from '@/hooks/useI18n';
import { useFeatureGuide } from '@/hooks/useFeatureGuide';
import { GuideStep } from '@/providers/FeatureGuideProvider';

// Order Summary Component
const OrderSummary: React.FC<CheckoutProps & {
    selectedPaymentMethod?: PaymentMethod | null;
    dynamicTransactionFee: number;
    dynamicApplicationFee: number;
    dynamicGrandTotal: number;
}> = ({ outlets, subtotal, selectedPaymentMethod, dynamicTransactionFee, dynamicApplicationFee, dynamicGrandTotal }) => {
    const t = useTranslations("checkout");
    const totalItems = outlets.reduce((total, outlet) => total + 1, 0);

    return (
        <div className="space-y-4">
            {outlets.map((outlet, index) => (
                <Card key={index} className="overflow-hidden py-0">
                    <CardContent className="p-0">
                        {/* Outlet Header */}
                        <div className="flex items-center gap-3 p-4 bg-muted/30 border-b">
                            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                                <Store className="w-3 h-3 text-primary-foreground" />
                            </div>
                            <span className="font-medium text-sm">{outlet.outletName}</span>
                        </div>

                        {/* Items Preview */}
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                    <Gift className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{t("orderSummary.productFrom", { outletName: outlet.outletName })}</p>
                                    <p className="text-xs text-muted-foreground">{t("orderSummary.otherProducts")}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">{formatCurrency(outlet.subtotal)}</p>
                                </div>
                            </div>

                            {/* Outlet Subtotal */}
                            <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-sm font-medium">{t("orderSummary.orderSubtotal")}</span>
                                <span className="font-semibold text-primary">
                                    {formatCurrency(outlet.subtotal)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Payment Summary - Show fees only when payment method is selected */}
            {selectedPaymentMethod && (dynamicTransactionFee > 0 || dynamicApplicationFee > 0) && (
                <Card className="py-0">
                    <CardContent className="p-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>{t("orderSummary.totalOrder", { count: totalItems })}</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>

                            {dynamicTransactionFee > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t("orderSummary.transactionFee")}</span>
                                    <span>{formatCurrency(dynamicTransactionFee)}</span>
                                </div>
                            )}

                            {dynamicApplicationFee > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t("orderSummary.applicationFee")}</span>
                                    <span>{formatCurrency(dynamicApplicationFee)}</span>
                                </div>
                            )}

                            <div className="flex justify-between pt-2 border-t border-blue-200">
                                <span className="font-semibold">{t("orderSummary.totalPayment")}</span>
                                <span className="font-bold text-lg text-primary">{formatCurrency(dynamicGrandTotal)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

// Checkout Button Component
const CheckoutButton: React.FC<{
    totalAmount: number;
    onCheckout: () => void;
    disabled?: boolean;
}> = ({ totalAmount, onCheckout, disabled }) => {
    const t = useTranslations("checkout");

    return (
        <Card className="sticky bottom-0 py-0 border-t shadow-lg">
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">{t("checkoutButton.totalPayment")}</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(totalAmount)}</p>
                    </div>
                    <Button
                        size="lg"
                        className="px-8 h-12"
                        data-guide-target="checkout-create-order"
                        onClick={onCheckout}
                        disabled={disabled}
                    >
                        {t("checkoutButton.createOrder")}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

const CheckoutPage: React.FC<CheckoutProps> = ({ outlets, subtotal, grandTotal }) => {
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
    const router = useRouter();
    const t = useTranslations("checkout");

    const checkoutGuideSteps = useMemo<GuideStep[]>(() => [
        {
            id: "checkout-overview",
            title: "Konfirmasi ringkasan pesanan",
            description: "Pastikan subtotal dan detail outlet sudah sesuai sebelum memilih metode pembayaran.",
            target: '[data-guide-target="checkout-order-summary"]',
            placement: "bottom",
            focusPadding: 18,
        },
        {
            id: "checkout-payment-method",
            title: "Pilih metode pembayaran",
            description: "Bandingkan metode yang tersedia lalu pilih yang paling cocok untuk transaksi kamu.",
            target: '[data-guide-target="checkout-payment-methods"]',
            placement: "top",
            focusPadding: 18,
        },
        {
            id: "checkout-create-order",
            title: "Buat order",
            description: "Setelah metode dipilih, tekan tombol ini untuk melanjutkan ke proses pembayaran.",
            target: '[data-guide-target="checkout-create-order"]',
            placement: "top",
            focusPadding: 16,
        },
    ], []);

    useFeatureGuide({
        id: "checkout-page-guide",
        steps: checkoutGuideSteps,
        autoStart: true,
        runOnceKey: "guide:checkout-page",
        delay: 900,
        enabled: outlets.length > 0,
    });

    // Calculate dynamic fees based on selected payment method
    const { dynamicTransactionFee, dynamicApplicationFee, dynamicGrandTotal } = useMemo(() => {
        if (!selectedPaymentMethod) {
            return {
                dynamicTransactionFee: 0,
                dynamicApplicationFee: 0,
                dynamicGrandTotal: subtotal
            };
        }

        // Calculate fees based on payment method type
        let transactionFee = 0;
        let appFee = 0;

        // Different fee structure based on payment method
        if (selectedPaymentMethod.type === 'qris') {
            // QRIS typically has lower transaction fees
            transactionFee = subtotal * 0.02; // 2%
            appFee = subtotal * 0.03; // 3%
        } else if (selectedPaymentMethod.type === 'va') {
            // Virtual Account has fixed fees
            transactionFee = 4000; // Flat fee Rp 4.000
            appFee = subtotal * 0.03; // 3%
        } else if (selectedPaymentMethod.type === 'manual') {
            transactionFee = 0;
            appFee = subtotal * 0;
        }

        return {
            dynamicTransactionFee: transactionFee,
            dynamicApplicationFee: appFee,
            dynamicGrandTotal: subtotal + transactionFee + appFee
        };
    }, [selectedPaymentMethod, subtotal]);

    const handleSelectPayment = (method: PaymentMethod) => {
        setSelectedPaymentMethod(method);
    };

    const handleCheckout = () => {
        if (!selectedPaymentMethod) {
            return;
        }

        // Use dynamic fees for payment data
        const paymentData = {
            checkoutData: {
                outlets,
                subtotal,
                totalTransactionFee: dynamicTransactionFee,
                applicationFee: dynamicApplicationFee,
                grandTotal: dynamicGrandTotal
            },
            selectedPaymentMethod
        };

        CheckoutService.savePaymentDataToStorage(paymentData);
        router.push('/payment');
    };

    return (
        <div className="space-y-4">
            <Card className="py-0">
                <CardContent className="p-4">
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Checkout</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded-md border bg-muted/30 px-2 py-1.5 text-center font-medium">1. Ringkasan</div>
                            <div className="rounded-md border bg-primary/10 text-primary px-2 py-1.5 text-center font-semibold">2. Checkout</div>
                            <div className="rounded-md border bg-muted/30 px-2 py-1.5 text-center font-medium">3. Pembayaran</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Order Summary */}
            <div data-guide-target="checkout-order-summary">
                <OrderSummary
                    outlets={outlets}
                    subtotal={subtotal}
                    totalTransactionFee={dynamicTransactionFee}
                    applicationFee={dynamicApplicationFee}
                    grandTotal={grandTotal}
                    selectedPaymentMethod={selectedPaymentMethod}
                    dynamicTransactionFee={dynamicTransactionFee}
                    dynamicApplicationFee={dynamicApplicationFee}
                    dynamicGrandTotal={dynamicGrandTotal}
                />
            </div>

            {/* Payment Methods */}
            <div data-guide-target="checkout-payment-methods">
                <PaymentMethodsList
                    onSelectPayment={handleSelectPayment}
                    selectedPayment={selectedPaymentMethod}
                />
            </div>

            {/* Checkout Button */}
            <CheckoutButton
                totalAmount={dynamicGrandTotal}
                onCheckout={handleCheckout}
                disabled={!selectedPaymentMethod}
            />
        </div>
    );
};

export default CheckoutPage;
