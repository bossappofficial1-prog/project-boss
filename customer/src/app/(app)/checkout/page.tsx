'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CheckoutPage from '@/components/checkout/CheckoutPage';
import { CheckoutService } from '@/services/checkout';
import { CheckoutData } from '@/types/checkout';
import { LoadingState } from '@/components/Base';
import { useAppBarV2 } from '@/context/AppBarContextV2';

const CHECKOUT_APP_BAR_CONFIG = {
    title: 'Checkout',
    showBackButton: true,
    showSearch: false,
    centerTitle: true,
};

export default function CheckoutPageWrapper() {
    const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { setAppBar, resetAppBar } = useAppBarV2()

    useEffect(() => {
        if (typeof window === 'undefined') return;
        setAppBar(CHECKOUT_APP_BAR_CONFIG);
        return () => resetAppBar();
    }, [setAppBar, resetAppBar]);

    useEffect(() => {
        const data = CheckoutService.getCheckoutDataFromStorage();

        if (!data) {
            router.push('/cart');
            return;
        }

        setCheckoutData(data);
        setIsLoading(false);
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <LoadingState />
            </div>
        );
    }

    if (!checkoutData) {
        return null;
    }

    return (
        <div className="py-2">
            <CheckoutPage
                outlets={checkoutData.outlets}
                subtotal={checkoutData.subtotal}
                tax={checkoutData.tax}
                grandTotal={checkoutData.grandTotal}
            />
        </div>
    );
}
