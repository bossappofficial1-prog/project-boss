import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/product/ProductDetails";
import { serverFetch } from "@/lib/server-fetch";
import type { OutletType } from "@/types";
import type { Product } from "@/types/product";

type Params = { slug?: string; productId?: string };

export default async function ProductDetailPage({ params }: { params: Promise<Params> }) {
    const { slug, productId } = await params

    const slugValid = typeof slug === "string" ? slug : undefined;
    const productIdValid = typeof productId === "string" ? productId : undefined;

    if (!slugValid || !productIdValid) {
        notFound();
    }

    // Server-side fetch — deduped by Next.js fetch cache
    const [productData, outletData] = await Promise.all([
        serverFetch<Product>(`/products/${productIdValid}`, {
            revalidate: 30,
            tags: [`product-${productIdValid}`],
        }),
        serverFetch<OutletType>(`/outlets/slug/${slugValid}`, {
            revalidate: 60,
            tags: [`outlet-${slugValid}`],
        }),
    ]);

    return (
        <ProductDetails
            slug={slugValid}
            productId={productIdValid}
            initialProductData={productData ?? undefined}
            initialOutletData={outletData ?? undefined}
        />
    );
}
