'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PaymentPage from '@/components/payment/PaymentPage';
import { CheckoutService } from '@/services/checkout';
import { useAppBarConfig } from '@/hooks/useAppBarConfig';
import { LoadingState } from '@/components/Base';

const PAYMENT_APP_BAR_CONFIG = {
    title: 'Pembayaran',
    showBackButton: true,
};

export default function Payment() {
    const [paymentData, setPaymentData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Configure app bar
    useAppBarConfig(PAYMENT_APP_BAR_CONFIG);

    useEffect(() => {
        const loadPaymentData = () => {
            const data = CheckoutService.getPaymentDataFromStorage();

            if (!data) {
                // No payment data, redirect to cart
                router.replace('/cart');
                return;
            }

            setPaymentData(data);
            setLoading(false);
        };

        loadPaymentData();
    }, [router]);

    if (loading) {
        return <LoadingState />;
    }

    if (!paymentData) {
        return null; // Will redirect
    }

    return (
        <PaymentPage
            checkoutData={paymentData.checkoutData}
            selectedPaymentMethod={paymentData.selectedPaymentMethod}
        />
    );
}
