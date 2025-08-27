'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Check,
    Wallet,
    Building2,
    CreditCard,
    Store,
    Shield,
    QrCode,
    ChevronRight,
    Gift
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CheckoutService } from '@/services/checkout';
import { OutletSummary, CheckoutProps, PaymentMethod } from '@/types/checkout';
import { DivXScroll } from '../shared/DivXScroll';

// Payment methods data
const paymentMethods: PaymentMethod[] = [
    {
        id: 'shopee-pay',
        name: 'ShopeePay',
        type: 'qris',
        icon: '🟠',
        description: 'Bayar pakai ShopeePay dapat koin'
    },
    {
        id: 'dana-qris',
        name: 'DANA',
        type: 'qris',
        icon: '💙',
        description: 'Bayar dengan QRIS DANA'
    },
    {
        id: 'ovo-qris',
        name: 'OVO',
        type: 'qris',
        icon: '💜',
        description: 'Bayar dengan QRIS OVO'
    },
    {
        id: 'gopay-qris',
        name: 'GoPay',
        type: 'qris',
        icon: '💚',
        description: 'Bayar dengan QRIS GoPay'
    },
    {
        id: 'bca-va',
        name: 'Transfer Bank BCA',
        type: 'va',
        icon: '🏦',
        description: 'Virtual Account BCA'
    },
    {
        id: 'bni-va',
        name: 'Transfer Bank BNI',
        type: 'va',
        icon: '🏦',
        description: 'Virtual Account BNI'
    },
    {
        id: 'mandiri-va',
        name: 'Transfer Bank Mandiri',
        type: 'va',
        icon: '🏦',
        description: 'Virtual Account Mandiri'
    },
    {
        id: 'bri-va',
        name: 'Transfer Bank BRI',
        type: 'va',
        icon: '🏦',
        description: 'Virtual Account BRI'
    },
    {
        id: 'visa',
        name: 'Kartu Kredit/Debit',
        type: 'credit',
        icon: '💳',
        description: 'Visa, Mastercard, JCB'
    }
];

// Utility function to format currency
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

// Order Summary Component
const OrderSummary: React.FC<CheckoutProps> = ({ outlets, subtotal, totalTransactionFee, applicationFee, grandTotal }) => {
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
                                    <p className="text-sm font-medium">Produk dari {outlet.outletName}</p>
                                    <p className="text-xs text-muted-foreground">+ produk lainnya</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">{formatCurrency(outlet.subtotal)}</p>
                                </div>
                            </div>

                            {/* Transaction Fee */}
                            {outlet.transactionFee > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Biaya Transaksi</span>
                                    <span>{formatCurrency(outlet.transactionFee)}</span>
                                </div>
                            )}

                            {/* Application Fee */}
                            {outlet.applicationFee > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Biaya Aplikasi</span>
                                    <span>{formatCurrency(outlet.applicationFee)}</span>
                                </div>
                            )}

                            {/* Outlet Subtotal */}
                            <div className="flex items-center justify-between pt-2 border-t">
                                <span className="text-sm font-medium">Subtotal Pesanan</span>
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
                            <span>Total Pesanan ({totalItems} outlet)</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        {totalTransactionFee > 0 && (
                            <div className="flex justify-between text-sm">
                                <span>Biaya Transaksi</span>
                                <span>{formatCurrency(totalTransactionFee)}</span>
                            </div>
                        )}
                        {applicationFee > 0 && (
                            <div className="flex justify-between text-sm">
                                <span>Biaya Aplikasi</span>
                                <span>{formatCurrency(applicationFee)}</span>
                            </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-blue-200">
                            <span className="font-semibold">Total Pembayaran</span>
                            <span className="font-bold text-lg text-primary">{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Payment Methods List Component
const PaymentMethodsList: React.FC<{
    onSelectPayment: (method: PaymentMethod) => void;
}> = ({ onSelectPayment }) => {
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'qris' | 'va' | 'credit'>('all');

    const filteredMethods = selectedCategory === 'all'
        ? paymentMethods
        : paymentMethods.filter(method => method.type === selectedCategory);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    Pilih Metode Pembayaran
                </CardTitle>

                {/* Category Tabs */}
                <DivXScroll className='gap-2'>
                    <Button
                        variant={selectedCategory === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('all')}
                        className="h-8"
                    >
                        Semua
                    </Button>
                    <Button
                        variant={selectedCategory === 'qris' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('qris')}
                        className="h-8"
                    >
                        <QrCode className="w-3 h-3 mr-1" />
                        QRIS
                    </Button>
                    <Button
                        variant={selectedCategory === 'va' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('va')}
                        className="h-8"
                    >
                        <Building2 className="w-3 h-3 mr-1" />
                        Bank
                    </Button>
                    <Button
                        variant={selectedCategory === 'credit' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('credit')}
                        className="h-8"
                    >
                        <CreditCard className="w-3 h-3 mr-1" />
                        Kartu
                    </Button>
                </DivXScroll>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="space-y-2">
                    {filteredMethods.map((method) => (
                        <button
                            key={method.id}
                            onClick={() => onSelectPayment(method)}
                            className="w-full p-4 border rounded-xl hover:border-primary/50 hover:bg-accent/30 transition-all text-left group hover:shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-lg">
                                        {method.icon}
                                    </div>
                                    <div>
                                        <div className="font-medium group-hover:text-primary transition-colors">
                                            {method.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {method.description}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {method.type === 'qris' && (
                                        <Badge variant="secondary" className="h-5 text-xs">
                                            Instan
                                        </Badge>
                                    )}
                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Security Notice */}
                <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">
                        Pembayaran aman dan terlindungi
                    </span>
                </div>
            </CardContent>
        </Card>
    );
};

// Checkout Button Component
const CheckoutButton: React.FC<{
    grandTotal: number;
    onCheckout: () => void;
}> = ({ grandTotal, onCheckout }) => {
    return (
        <Card className="sticky bottom-0 py-0 border-t shadow-lg">
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(grandTotal)}</p>
                    </div>
                    <Button
                        size="lg"
                        className="px-8 h-12"
                        onClick={onCheckout}
                    >
                        Buat Pesanan
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

// Main Checkout Component
const CheckoutPage: React.FC<CheckoutProps> = ({ outlets, subtotal, totalTransactionFee, applicationFee, grandTotal }) => {
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
    const router = useRouter();

    const handleSelectPayment = (method: PaymentMethod) => {
        setSelectedPaymentMethod(method);
    };

    const handleCheckout = () => {
        if (!selectedPaymentMethod) {
            // Scroll to payment methods
            return;
        }

        // Save payment data and redirect to payment page
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
            <PaymentMethodsList onSelectPayment={handleSelectPayment} />

            {/* Selected Payment Method Indicator */}
            {selectedPaymentMethod && (
                <Card className="border-green-200/75 py-0 px-0 bg-green-50/10">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-green-600" />
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-sm">
                                    {selectedPaymentMethod.icon}
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{selectedPaymentMethod.name}</p>
                                    <p className="text-xs text-muted-foreground">Metode pembayaran dipilih</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPaymentMethod(null)}
                            >
                                Ubah
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Checkout Button */}
            <CheckoutButton grandTotal={grandTotal} onCheckout={handleCheckout} />
        </div>
    );
};

export default CheckoutPage;
