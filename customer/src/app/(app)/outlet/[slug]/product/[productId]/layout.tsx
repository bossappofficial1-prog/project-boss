import type { Metadata } from "next";
import { ProductType, OutletType } from "@/types";
import { serverFetch } from "@/lib/server-fetch";

type Props = {
    params: Promise<{ slug: string; productId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug, productId } = await params;

    const [product, outlet] = await Promise.all([
        serverFetch<ProductType>(`/products/${productId}`, {
            revalidate: 30,
            tags: [`product-${productId}`],
        }),
        serverFetch<OutletType>(`/outlets/slug/${slug}`, {
            revalidate: 60,
            tags: [`outlet-${slug}`],
        }),
    ]);

    if (!product) {
        return {
            title: "Product Tidak Ditemukan - Boss App",
            description: "Product yang Anda cari tidak ditemukan.",
        };
    }

    return {
        title: `${product.name} | ${outlet?.name ?? "Boss App"}`,
        description: product.description || `Detail product ${product.name}`,
        openGraph: {
            title: `${product.name} | ${outlet?.name ?? "Boss App"}`,
            description: product.description || `Detail product ${product.name}`,
            images: product.image ? [product.image] : [],
            type: "website"
        },
        twitter: {
            card: "summary_large_image",
            title: `${product.name} | ${outlet?.name ?? "Boss App"}`,
            description: product.description || `Detail product ${product.name}`,
            images: product.image ? [product.image] : [],
        },
    };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
    return children;
}
