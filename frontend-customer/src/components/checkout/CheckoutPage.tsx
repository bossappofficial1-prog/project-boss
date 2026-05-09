'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Store,
    ShoppingBag,
    CreditCard,
    ShieldCheck,
    UtensilsCrossed,
    Gift,
    Receipt
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
import { useCart } from '@/hooks/useCart';
import { Badge } from '@/components/ui/badge';

// Order Summary Component
const OrderSummary: React.FC<CheckoutProps & {
    selectedPaymentMethod?: PaymentMethod | null;
    dynamicTransactionFee: number;
    dynamicApplicationFee: number;
    dynamicGrandTotal: number;
    tableId: string | null;
    tableName: string | null;
    tableOutletId: string | null;
}> = ({ outlets, subtotal, selectedPaymentMethod, dynamicTransactionFee, dynamicApplicationFee, dynamicGrandTotal, tableId, tableName, tableOutletId }) => {
    const t = useTranslations("checkout");
    const totalItems = outlets.reduce((total, outlet) => total + 1, 0);

    return (
        <div className="space-y-4">
            {/* Dining Info Card */}
            {tableId && outlets.some(o => o.outletId === tableOutletId) && (
                <Card className="border-primary/20 py-0 bg-primary/5 dark:bg-primary/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shrink-0">
                            <UtensilsCrossed className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">{t("orderSummary.diningOption")}</p>
                            <h3 className="text-sm font-bold">{t("orderSummary.tableOrdering", { tableId: tableName || tableId })}</h3>
                            <p className="text-[11px] text-muted-foreground">{t("orderSummary.tableOrderingDesc")}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {outlets.map((outlet, index) => (
                <Card key={index} className="overflow-hidden py-0">
                    <CardHeader className="py-3 px-4 bg-muted/30 gap-0 border-b">
                        <CardTitle className="flex items-center gap-2 text-[13px] font-medium sm:text-sm">
                            <Store className="w-4 h-4 text-primary" />
                            {outlet.outletName}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 space-y-3">
                        {/* Items Summary Preview */}
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0">
                                <Gift className="w-6 h-6 text-muted-foreground/50" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium truncate">
                                    {t("orderSummary.productFrom", { outletName: outlet.outletName })}
                                </p>
                                <p className="text-[11px] text-muted-foreground">{t("orderSummary.otherProducts")}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[13px] font-bold">{formatCurrency(outlet.subtotal)}</p>
                            </div>
                        </div>
                        {/* Outlet Subtotal */}
                        <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs font-medium text-muted-foreground">{t("orderSummary.orderSubtotal")}</span>
                            <span className="text-[13px] font-bold text-primary">
                                {formatCurrency(outlet.subtotal)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Price Breakdown */}
            <Card className='py-0'>
                <CardHeader className="px-4 py-4 gap-0 border-b">
                    <CardTitle className="flex items-center gap-2 text-[13px] font-medium sm:text-sm">
                        <Receipt className="w-4 h-4 text-primary" />
                        {t("paymentSummary")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 space-y-2">
                    <div className="flex justify-between text-[13px]">
                        <span className="text-muted-foreground">{t("orderSummary.totalOrder", { count: totalItems })}</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>

                    {(props.tax ?? 0) > 0 && (
                        <div className="flex justify-between text-[13px]">
                            <span className="text-muted-foreground">PPN</span>
                            <span>{formatCurrency(props.tax ?? 0)}</span>
                        </div>
                    )}

                    {selectedPaymentMethod && (
                        <>
                            {dynamicTransactionFee > 0 && (
                                <div className="flex justify-between text-[13px]">
                                    <span className="text-muted-foreground">{t("orderSummary.transactionFee")}</span>
                                    <span>{formatCurrency(dynamicTransactionFee)}</span>
                                </div>
                            )}

                            {dynamicApplicationFee > 0 && (
                                <div className="flex justify-between text-[13px]">
                                    <span className="text-muted-foreground">{t("orderSummary.applicationFee")}</span>
                                    <span>{formatCurrency(dynamicApplicationFee)}</span>
                                </div>
                            )}
                        </>
                    )}

                    <div className="flex justify-between pt-3 border-t text-base font-bold">
                        <span>{t("orderSummary.totalPayment")}</span>
                        <span className="text-primary">{formatCurrency(dynamicGrandTotal)}</span>
                    </div>
                </CardContent>
            </Card>
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
                        <p className="text-xs text-muted-foreground sm:text-sm">{t("checkoutButton.totalPayment")}</p>
                        <p className="text-base font-bold text-primary sm:text-lg">{formatCurrency(totalAmount)}</p>
                    </div>
                    <Button
                        size="lg"
                        className="h-11 px-8 text-sm font-bold flex-1 sm:flex-initial"
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

const CheckoutPage: React.FC<CheckoutProps> = ({ outlets, subtotal, tax, grandTotal }) => {
    const { tableId, tableName, tableOutletId } = useCart();
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

    const { dynamicTransactionFee, dynamicApplicationFee, dynamicGrandTotal } = useMemo(() => {
        if (!selectedPaymentMethod) {
            return {
                dynamicTransactionFee: 0,
                dynamicApplicationFee: 0,
                dynamicGrandTotal: subtotal + (tax ?? 0)
            };
        }

        let transactionFee = 0;
        let appFee = 0;

        if (selectedPaymentMethod.type === 'qris') {
            transactionFee = subtotal * 0.02;
            appFee = subtotal * 0.03;
        } else if (selectedPaymentMethod.type === 'va') {
            transactionFee = 4000;
            appFee = subtotal * 0.03;
        } else if (selectedPaymentMethod.type === 'manual') {
            transactionFee = 0;
            appFee = 0;
        }

        return {
            dynamicTransactionFee: transactionFee,
            dynamicApplicationFee: appFee,
            dynamicGrandTotal: subtotal + (tax ?? 0) + transactionFee + appFee
        };
    }, [selectedPaymentMethod, subtotal, tax]);

    const handleSelectPayment = (method: PaymentMethod) => {
        setSelectedPaymentMethod(method);
    };

    const handleCheckout = () => {
        if (!selectedPaymentMethod) return;

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
            {/* Stepper matching PaymentPage */}
            <Card className="py-0">
                <CardContent className="p-4">
                    <div className="space-y-2">
                        <p className="text-[13px] font-medium sm:text-sm">{t("title")}</p>
                        <div className="grid grid-cols-3 gap-2 text-[11px] sm:text-xs">
                            <div className="rounded-md border bg-muted/30 px-2 py-1.5 text-center font-medium">{t("stepper.summary")}</div>
                            <div className="rounded-md border bg-primary/10 px-2 py-1.5 text-center font-semibold text-primary">{t("stepper.checkout")}</div>
                            <div className="rounded-md border bg-muted/30 px-2 py-1.5 text-center font-medium">{t("stepper.payment")}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Order Summary */}
            <div data-guide-target="checkout-order-summary">
                <OrderSummary
                    grandTotal={grandTotal}
                    outlets={outlets}
                    subtotal={subtotal}
                    dynamicTransactionFee={dynamicTransactionFee}
                    dynamicApplicationFee={dynamicApplicationFee}
                    dynamicGrandTotal={dynamicGrandTotal}
                    tableId={tableId}
                    tableName={tableName}
                    tableOutletId={tableOutletId}
                    selectedPaymentMethod={selectedPaymentMethod}
                />
            </div>

            {/* Payment Methods */}
            <div data-guide-target="checkout-payment-methods" className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <h3 className="text-[13px] font-bold sm:text-sm">{t("paymentMethod")}</h3>
                </div>
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
