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
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Informasi Pembeli
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Nama Lengkap
                    </label>
                    <Input
                        placeholder="Masukkan nama lengkap"
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
                        Nomor Telepon
                    </label>
                    <Input
                        placeholder="Contoh: 081234567890"
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
                        Informasi ini akan digunakan untuk konfirmasi pesanan dan pengiriman.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

// Order Summary Component for Payment
const PaymentOrderSummary: React.FC<{ checkoutData: CheckoutData }> = ({ checkoutData }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-primary" />
                    Ringkasan Pesanan
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
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatCurrency(outlet.subtotal)}</span>
                            </div>

                            {outlet.transactionFee > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Biaya Transaksi</span>
                                    <span>{formatCurrency(outlet.transactionFee)}</span>
                                </div>
                            )}

                            {outlet.applicationFee > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Biaya Aplikasi</span>
                                    <span>{formatCurrency(outlet.applicationFee)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Total Summary */}
                <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Total Pesanan</span>
                        <span>{formatCurrency(checkoutData.subtotal)}</span>
                    </div>

                    {checkoutData.totalTransactionFee > 0 && (
                        <div className="flex justify-between text-sm">
                            <span>Total Biaya Transaksi</span>
                            <span>{formatCurrency(checkoutData.totalTransactionFee)}</span>
                        </div>
                    )}

                    {checkoutData.applicationFee > 0 && (
                        <div className="flex justify-between text-sm">
                            <span>Biaya Aplikasi</span>
                            <span>{formatCurrency(checkoutData.applicationFee)}</span>
                        </div>
                    )}

                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                        <span>Total Pembayaran</span>
                        <span className="text-primary">{formatCurrency(checkoutData.grandTotal)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Payment Method Display Component
const PaymentMethodDisplay: React.FC<{ method: PaymentMethod }> = ({ method }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Metode Pembayaran
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
                        {method.type === 'qris' ? 'QRIS' : method.type === 'va' ? 'Bank Transfer' : 'Kartu'}
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
    return (
        <Card className="sticky bottom-0 py-0 border-t shadow-lg">
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(amount)}</p>
                    </div>
                    <Button
                        size="lg"
                        className="px-8 h-12"
                        onClick={onPay}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Memproses...' : 'Bayar Sekarang'}
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
    const { items: cartItems } = useCart();

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
            newErrors.name = 'Nama lengkap wajib diisi';
        }

        if (!customerInfo.phone.trim()) {
            newErrors.phone = 'Nomor telepon wajib diisi';
        } else if (!/^(\+62|62|0)[0-9]{9,12}$/.test(customerInfo.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Format nomor telepon tidak valid';
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
            // Construct payload for backend API
            let itemDetails: Array<{ productId: string; quantity: number; outletId: string }> = [];

            // Try to get items from checkoutData first
            const checkoutItems = checkoutData.outlets.flatMap(outlet => {
                if (!outlet.items || !Array.isArray(outlet.items)) {
                    return [];
                }
                return outlet.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    outletId: item.outletId
                }));
            });

            if (checkoutItems.length > 0) {
                itemDetails = checkoutItems;
            } else {
                // Fallback to cart items if checkoutData doesn't have items
                console.warn('Using cart items as fallback for payment payload');
                itemDetails = cartItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    outletId: item.outletId
                }));
            }

            const payloadBody = {
                customer_details: {
                    name: customerInfo.name,
                    phone: customerInfo.phone
                },
                item_details: itemDetails,
                payment_method: selectedPaymentMethod.id as any
            };

            console.log('Payment payload:', payloadBody);

            // Check if we have any items
            if (itemDetails.length === 0) {
                throw new Error('No items found. Please go back to cart and add items.');
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

            // Redirect to success page
            router.push('/payment/processing');

        } catch (error) {
            console.error('Payment failed:', error);
            // You can add a toast notification here or show an error message to the user
            alert(error instanceof Error ? error.message : 'Payment processing failed. Please try again.');
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
