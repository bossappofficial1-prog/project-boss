'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PaymentPage from '@/components/payment/PaymentPage';
import { CheckoutService } from '@/services/checkout';
import { LoadingState } from '@/components/Base';
import { useAppBarV2 } from '@/context/AppBarContextV2';
import { useTranslations } from '@/hooks/useI18n';

export default function Payment() {
    const t = useTranslations("paymentPage");
    const [paymentData, setPaymentData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { setAppBar, resetAppBar } = useAppBarV2()

    useEffect(() => {
        if (typeof window === 'undefined') return;
        setAppBar({ title: t("title"), showBackButton: true });
        return () => resetAppBar();
    }, [setAppBar, resetAppBar, t])

    useEffect(() => {
        const loadPaymentData = () => {
            const data = CheckoutService.getPaymentDataFromStorage();

            if (!data) {
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
