'use client';

import React, { useState } from 'react';
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

// Order Summary Component
const OrderSummary: React.FC<CheckoutProps> = ({ outlets, subtotal, totalTransactionFee, applicationFee, grandTotal }) => {
    const t = useTranslations("checkout");
    const totalItems = outlets.reduce((total, outlet) => total + 1, 0);
    console.log(outlets);

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

                            {/* Transaction Fee */}
                            {outlet.transactionFee > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{t("orderSummary.transactionFee")}</span>
                                    <span>{formatCurrency(outlet.transactionFee)}</span>
                                </div>
                            )}

                            {/* Application Fee */}
                            {outlet.applicationFee > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{t("orderSummary.applicationFee")}</span>
                                    <span>{formatCurrency(outlet.applicationFee)}</span>
                                </div>
                            )}

                            {/* Outlet Subtotal */}
                            <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-sm font-medium">{t("orderSummary.orderSubtotal")}</span>
                                <span className="font-semibold text-primary">
                                    {formatCurrency(outlet.subtotal + outlet.transactionFee + outlet.applicationFee)}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Payment Summary */}
            <Card className="py-0">
                <CardContent className="p-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>{t("orderSummary.totalOrder", { count: totalItems })}</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        {totalTransactionFee > 0 && (
                            <div className="flex justify-between text-sm">
                                <span>{t("orderSummary.transactionFee")}</span>
                                <span>{formatCurrency(totalTransactionFee)}</span>
                            </div>
                        )}
                        {applicationFee > 0 && (
                            <div className="flex justify-between text-sm">
                                <span>{t("orderSummary.applicationFee")}</span>
                                <span>{formatCurrency(applicationFee)}</span>
                            </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-blue-200">
                            <span className="font-semibold">{t("orderSummary.totalPayment")}</span>
                            <span className="font-bold text-lg text-primary">{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Checkout Button Component
const CheckoutButton: React.FC<{
    grandTotal: number;
    onCheckout: () => void;
}> = ({ grandTotal, onCheckout }) => {
    const t = useTranslations("checkout");

    return (
        <Card className="sticky bottom-0 py-0 border-t shadow-lg">
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">{t("checkoutButton.totalPayment")}</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(grandTotal)}</p>
                    </div>
                    <Button
                        size="lg"
                        className="px-8 h-12"
                        onClick={onCheckout}
                    >
                        {t("checkoutButton.createOrder")}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

const CheckoutPage: React.FC<CheckoutProps> = ({ outlets, subtotal, totalTransactionFee, applicationFee, grandTotal }) => {
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
    const router = useRouter();

    const handleSelectPayment = (method: PaymentMethod) => {
        setSelectedPaymentMethod(method);
    };

    const handleCheckout = () => {
        if (!selectedPaymentMethod) {
            return;
        }

        const paymentData = {
            checkoutData: { outlets, subtotal, totalTransactionFee, applicationFee, grandTotal },
            selectedPaymentMethod
        };

        CheckoutService.savePaymentDataToStorage(paymentData);
        router.push('/payment');
    };

    return (
        <div className="space-y-4">
            {/* Order Summary */}
            <OrderSummary
                outlets={outlets}
                subtotal={subtotal}
                totalTransactionFee={totalTransactionFee}
                applicationFee={applicationFee}
                grandTotal={grandTotal}
            />

            {/* Payment Methods */}
            <PaymentMethodsList
                onSelectPayment={handleSelectPayment}
                selectedPayment={selectedPaymentMethod!}
            />

            {/* Checkout Button */}
            <CheckoutButton
                grandTotal={grandTotal}
                onCheckout={handleCheckout}
            />
        </div>
    );
};

export default CheckoutPage;
