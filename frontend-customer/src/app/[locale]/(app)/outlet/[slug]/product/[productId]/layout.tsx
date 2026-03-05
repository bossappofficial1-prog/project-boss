import type { Metadata } from "next";
import axios from 'axios';
import { ProductType } from "@/types";
import { Outlet } from "@/services/outlets";

type Props = {
    params: Promise<{ slug: string; productId: string }>;
};

async function getProduct(outletId: string, productId: string): Promise<ProductType | null> {
    try {
        const res = await axios.get(`${process.env.SERVER_API_URL}/products/${productId}`);
        return res.data?.data || null;
    } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug, productId } = await params;
    const product = await getProduct(slug, productId);
    const outlet = await Outlet.getDetail(slug)

    if (!product) {
        return {
            title: "Product Tidak Ditemukan - Boss App",
            description: "Product yang Anda cari tidak ditemukan.",
        };
    }

    return {
        title: `${product.name} | ${outlet.name}`,
        description: product.description || `Detail product ${product.name}`,
        openGraph: {
            title: `${product.name} | ${outlet.name}`,
            description: product.description || `Detail product ${product.name}`,
            images: product.image ? [product.image] : [],
            type: "website"
        },
        twitter: {
            card: "summary_large_image",
            title: `${product.name} | ${outlet.name}`,
            description: product.description || `Detail product ${product.name}`,
            images: product.image ? [product.image] : [],
        },
    };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
    return children;
}
