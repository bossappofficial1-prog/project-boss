import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/product/ProductDetails";

type Params = { id?: string; productId?: string };

export default async function ProductDetailPage({ params }: { params: Promise<Params> }) {
    const { id, productId } = await params

    const outletId = typeof id === "string" ? id : undefined;
    const productIdValid = typeof productId === "string" ? productId : undefined;

    if (!outletId || !productIdValid) {
        notFound();
    }

    return <ProductDetails outletId={outletId} productId={productIdValid} />;
}
