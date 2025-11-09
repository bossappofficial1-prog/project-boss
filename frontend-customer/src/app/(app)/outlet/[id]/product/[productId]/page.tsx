import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/product/ProductDetails";

type Params = { id?: string; productId?: string };

export default function ProductDetailPage({ params }: { params: Params }) {
    const outletId = typeof params?.id === "string" ? params.id : undefined;
    const productId = typeof params?.productId === "string" ? params.productId : undefined;

    if (!outletId || !productId) {
        notFound();
    }

    return <ProductDetails outletId={outletId} productId={productId} />;
}
