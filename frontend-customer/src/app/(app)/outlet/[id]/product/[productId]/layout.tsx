import type { Metadata } from "next";
import { ProductType } from "@/types";

type Props = {
    params: Promise<{ id: string; productId: string }>;
};

async function getProduct(outletId: string, productId: string): Promise<ProductType | null> {
    try {
        const res = await fetch(`${process.env.SERVER_API_URL}/products/${productId}`);
        const data = await res.json().then((data) => {
            return data.data
        }).catch((error) => {
            console.log(error);
            return null
        })

        return data
    } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id, productId } = await params;
    const product = await getProduct(id, productId);

    if (!product) {
        return {
            title: "Product Tidak Ditemukan - Boss App",
            description: "Product yang Anda cari tidak ditemukan.",
        };
    }

    return {
        title: `${product.name} - Boss App`,
        description: product.description || `Detail product ${product.name}`,
        openGraph: {
            title: `${product.name} - Boss App`,
            description: product.description || `Detail product ${product.name}`,
            images: product.image ? [product.image] : [],
            type: "website"
        },
        twitter: {
            card: "summary_large_image",
            title: `${product.name} - Boss App`,
            description: product.description || `Detail product ${product.name}`,
            images: product.image ? [product.image] : [],
        },
    };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
    return children;
}
