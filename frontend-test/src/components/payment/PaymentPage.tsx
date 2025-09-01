'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    User,
    Phone,
    Receipt,
    AlertCircle,
    CheckCircle,
    Store,
    CreditCard
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CheckoutData, PaymentMethod } from '@/types/checkout';
import { CheckoutService } from '@/services/checkout';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { useTranslations } from '@/hooks/useI18n';
import { PaymentMethodId } from '@/types';

interface PaymentPageProps {
    checkoutData: CheckoutData;
    selectedPaymentMethod: PaymentMethod;
}

interface CustomerInfo {
    name: string;
    phone: string;
}

// Customer Info Form Component
const CustomerInfoForm: React.FC<{
    customerInfo: CustomerInfo;
    onInfoChange: (info: CustomerInfo) => void;
    errors: Record<string, string>;
}> = ({ customerInfo, onInfoChange, errors }) => {
    const t = useTranslations("paymentPage");

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    {t("customerInfo.title")}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("customerInfo.fullName")}
                    </label>
                    <Input
                        placeholder={t("customerInfo.fullNamePlaceholder")}
                        value={customerInfo.name}
                        onChange={(e) => onInfoChange({ ...customerInfo, name: e.target.value })}
                        className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.name}
                        </p>
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {t("customerInfo.phoneNumber")}
                    </label>
                    <Input
                        placeholder={t("customerInfo.phonePlaceholder")}
                        value={customerInfo.phone}
                        onChange={(e) => onInfoChange({ ...customerInfo, phone: e.target.value })}
                        className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.phone}
                        </p>
                    )}
                </div>

                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-sm text-blue-700">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        {t("customerInfo.infoMessage")}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

// Order Summary Component for Payment
const PaymentOrderSummary: React.FC<{ checkoutData: CheckoutData }> = ({ checkoutData }) => {
    const t = useTranslations("paymentPage");

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-primary" />
                    {t("orderSummary.title")}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
                {checkoutData.outlets.map((outlet, index) => (
                    <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Store className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">{outlet.outletName}</span>
                        </div>

                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("orderSummary.subtotal")}</span>
                                <span>{formatCurrency(outlet.subtotal)}</span>
                            </div>

                            {outlet.transactionFee > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t("orderSummary.transactionFee")}</span>
                                    <span>{formatCurrency(outlet.transactionFee)}</span>
                                </div>
                            )}

                            {outlet.applicationFee > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t("orderSummary.applicationFee")}</span>
                                    <span>{formatCurrency(outlet.applicationFee)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Total Summary */}
                <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>{t("orderSummary.totalOrder")}</span>
                        <span>{formatCurrency(checkoutData.subtotal)}</span>
                    </div>

                    {checkoutData.totalTransactionFee > 0 && (
                        <div className="flex justify-between text-sm">
                            <span>{t("orderSummary.totalTransactionFee")}</span>
                            <span>{formatCurrency(checkoutData.totalTransactionFee)}</span>
                        </div>
                    )}

                    {checkoutData.applicationFee > 0 && (
                        <div className="flex justify-between text-sm">
                            <span>{t("orderSummary.applicationFee")}</span>
                            <span>{formatCurrency(checkoutData.applicationFee)}</span>
                        </div>
                    )}

                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                        <span>{t("orderSummary.totalPayment")}</span>
                        <span className="text-primary">{formatCurrency(checkoutData.grandTotal)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Payment Method Display Component
const PaymentMethodDisplay: React.FC<{ method: PaymentMethod }> = ({ method }) => {
    const t = useTranslations("paymentPage");

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    {t("paymentMethod.title")}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-lg shadow-sm">
                        {method.icon}
                    </div>
                    <div className="flex-1">
                        <p className="font-medium">{method.name}</p>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                    <Badge variant="secondary" className="h-6">
                        {method.type === 'qris' ? t("paymentMethod.types.qris") :
                            method.type === 'va' ? t("paymentMethod.types.va") :
                                t("paymentMethod.types.card")}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
};

// Payment Button Component
const PaymentButton: React.FC<{
    onPay: () => void;
    amount: number;
    isLoading: boolean;
}> = ({ onPay, amount, isLoading }) => {
    const t = useTranslations("paymentPage");

    return (
        <Card className="sticky bottom-0 py-0 border-t shadow-lg">
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">{t("paymentButton.totalPayment")}</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(amount)}</p>
                    </div>
                    <Button
                        size="lg"
                        className="px-8 h-12"
                        onClick={onPay}
                        disabled={isLoading}
                    >
                        {isLoading ? t("paymentButton.processing") : t("paymentButton.payNow")}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

// Main Payment Page Component
const PaymentPage: React.FC<PaymentPageProps> = ({ checkoutData, selectedPaymentMethod }) => {
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ name: '', phone: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { items: cartItems, clearCart } = useCart();
    const t = useTranslations("paymentPage");

    // Load customer info from ProfileSettings (if available)
    useEffect(() => {
        // Try to get customer info from localStorage or other sources
        const savedProfile = localStorage.getItem('user_preferences');
        if (savedProfile) {
            try {
                const profile = JSON.parse(savedProfile);
                setCustomerInfo({
                    name: profile.fullName || '',
                    phone: profile.phone || ''
                });
            } catch (error) {
                console.error('Failed to load profile:', error);
            }
        }
    }, []);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!customerInfo.name.trim()) {
            newErrors.name = t("validation.nameRequired");
        }

        if (!customerInfo.phone.trim()) {
            newErrors.phone = t("validation.phoneRequired");
        } else if (!/^(\+62|62|0)[0-9]{9,12}$/.test(customerInfo.phone.replace(/\s/g, ''))) {
            newErrors.phone = t("validation.phoneInvalid");
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePayment = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Construct payload for backend API sesuai format yang benar
            let itemDetails: Array<{ productId: string; quantity: number }> = [];
            let selectedSlotId: string | undefined;
            let outletId: string = '';

            // Try to get items from checkoutData first
            const checkoutItems = checkoutData.outlets.flatMap(outlet => {
                if (!outlet.items || !Array.isArray(outlet.items)) {
                    return [];
                }

                // Set outletId dari outlet pertama (karena checkout hanya 1 outlet)
                if (!outletId) {
                    outletId = outlet.items[0]?.outletId || '';
                }

                return outlet.items.map(item => {
                    // Untuk service products, ambil selectedSlotId
                    if (item.type === 'SERVICE' && item.selectedSlot && !selectedSlotId) {
                        selectedSlotId = item.selectedSlot;
                    }

                    // Return item dengan format yang benar
                    return {
                        productId: item.productId,
                        quantity: item.quantity
                    };
                });
            });

            if (checkoutItems.length > 0) {
                itemDetails = checkoutItems;
            } else {
                // Fallback to cart items if checkoutData doesn't have items
                console.warn('Using cart items as fallback for payment payload');
                const fallbackItems = cartItems.map(item => {
                    // Set outletId dari cart item pertama
                    if (!outletId) {
                        outletId = item.outletId;
                    }

                    // Untuk service products, ambil selectedSlotId
                    if (item.type === 'SERVICE' && item.selectedSlot && !selectedSlotId) {
                        selectedSlotId = item.selectedSlot;
                    }

                    return {
                        productId: item.productId,
                        quantity: item.quantity
                    };
                });
                itemDetails = fallbackItems;
            }

            // Construct payload sesuai format backend yang benar
            const payloadBody = {
                outletId: outletId,
                customer_details: {
                    name: customerInfo.name,
                    phone: customerInfo.phone
                },
                item_details: itemDetails,
                payment_method: selectedPaymentMethod.id as PaymentMethodId,
                ...(selectedSlotId && { selectedSlotId: selectedSlotId })
            };

            // Debug log untuk memastikan payload sesuai
            console.log('Payment Payload:', {
                outletId,
                customer_details: payloadBody.customer_details,
                item_details: payloadBody.item_details,
                payment_method: payloadBody.payment_method,
                selectedSlotId: payloadBody.selectedSlotId
            });

            // Check if we have any items
            if (itemDetails.length === 0) {
                throw new Error(t("errors.noItems"));
            }

            // Send to backend API
            const response = await CheckoutService.processPayment(payloadBody);

            // Save payment info for local reference
            const paymentInfo = {
                checkoutData,
                selectedPaymentMethod,
                customerInfo,
                paymentDate: new Date().toISOString(),
                status: 'pending',
                payload: payloadBody
            };

            localStorage.setItem('lastPayment', JSON.stringify(paymentInfo));
            localStorage.setItem("paymentInfo", JSON.stringify(response))

            // Clear checkout and payment data
            CheckoutService.clearCheckoutDataFromStorage();
            CheckoutService.clearPaymentDataFromStorage();
            clearCart()

            // Redirect to success page
            router.push('/payment/processing');

        } catch (error) {
            console.error('Payment failed:', error)
            alert(error instanceof Error ? error.message : t("errors.paymentFailed"));
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Customer Info Form */}
            <CustomerInfoForm
                customerInfo={customerInfo}
                onInfoChange={setCustomerInfo}
                errors={errors}
            />

            {/* Payment Method Display */}
            <PaymentMethodDisplay method={selectedPaymentMethod} />

            {/* Order Summary */}
            <PaymentOrderSummary checkoutData={checkoutData} />

            {/* Payment Button */}
            <PaymentButton
                onPay={handlePayment}
                amount={checkoutData.grandTotal}
                isLoading={isLoading}
            />
        </div>
    );
};

export default PaymentPage;
