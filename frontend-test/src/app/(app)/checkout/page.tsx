'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CheckoutPage from '@/components/checkout/CheckoutPage';
import { CheckoutService } from '@/services/checkout';
import { useAppBarConfig } from '@/hooks/useAppBarConfig';
import LoadingEffect from '@/components/shared/LoadingEffect';
import { CheckoutData } from '@/types/checkout';
import { LoadingState } from '@/components/Base';

const CHECKOUT_APP_BAR_CONFIG = {
    title: 'Checkout',
    showBackButton: true,
};

export default function CheckoutPageWrapper() {
    const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useAppBarConfig(CHECKOUT_APP_BAR_CONFIG);

    useEffect(() => {
        // Get checkout data from localStorage
        const data = CheckoutService.getCheckoutDataFromStorage();

        if (!data) {
            // No checkout data found, redirect back to cart
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
                totalTransactionFee={checkoutData.totalTransactionFee}
                applicationFee={checkoutData.applicationFee}
                grandTotal={checkoutData.grandTotal}
            />
        </div>
    );
}
