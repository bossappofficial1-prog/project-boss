import { notFound } from "next/navigation";
import { OutletContent } from "@/components/outlet/OutletContent";
import { serverFetch } from "@/lib/server-fetch";
import type { OutletType } from "@/types";
import type { Product } from "@/types/product";

type Params = Promise<{ slug?: string }>;

export default async function Page({ params }: { params: Params }) {
    const resolvedParams = await params;
    const slug = typeof resolvedParams?.slug === "string" ? resolvedParams.slug : undefined;

    if (!slug) {
        notFound();
    }
    // Server-side fetch — data cached via Next.js fetch cache with revalidation tags
    const [outletData, productsData] = await Promise.all([
        serverFetch<OutletType>(`/outlets/slug/${slug}`, {
            revalidate: 60,
            tags: [`outlet-${slug}`],
        }),
        serverFetch<Product[]>(`/products/outlet/${slug}?accessed=PUBLIC`, {
            revalidate: 30,
            tags: [`products-${slug}`],
        }),
    ]);

    return (
        <OutletContent
            slug={slug}
            initialOutletData={outletData ?? undefined}
            initialProductsData={productsData ?? undefined}
        />
    );
}