import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/product/ProductDetails";

type Params = { slug?: string; productId?: string };

export default async function ProductDetailPage({ params }: { params: Promise<Params> }) {
    const { slug, productId } = await params

    const slugValid = typeof slug === "string" ? slug : undefined;
    const productIdValid = typeof productId === "string" ? productId : undefined;

    if (!slugValid || !productIdValid) {
        notFound();
    }

    return <ProductDetails slug={slugValid} productId={productIdValid} />;
}
