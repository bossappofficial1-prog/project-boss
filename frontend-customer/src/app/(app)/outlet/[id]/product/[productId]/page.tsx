'use client'

import { ProductDetails } from "@/components/product/ProductDetails";

type Props = {
    params: Promise<{ id: string; productId: string }>;
};

export default function ProductDetailPage({ params }: Props) {
    return <ProductDetails params={params} />;
}
