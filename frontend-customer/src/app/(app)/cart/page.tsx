"use client";

import { LoadingState } from "@/components/Base";
import { CartContent } from "@/components/pages/cart/CartContent";
import { Suspense, useLayoutEffect } from "react";

export default function CartPage() {
    useLayoutEffect(() => {
        document.title = "Keranjang | BOSS";
    }, []);

    return (
        <Suspense fallback={<LoadingState message="Loading cart page..." />}>
            <CartContent />
        </Suspense>
    );
}