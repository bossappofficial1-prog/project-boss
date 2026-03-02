import { LoadingState } from "@/components/Base";
import { CartContent } from "@/components/pages/cart/CartContent";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: 'Keranjang'
}

export default function CartPagge() {
    return (
        <Suspense fallback={<LoadingState message="Loading cart page..." />}>
            <CartContent />
        </Suspense>
    )
}