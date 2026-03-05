import { notFound } from "next/navigation";
import { OutletContent } from "@/components/outlet/OutletContent";

type Params = Promise<{ slug?: string }>;

export default async function Page({ params }: { params: Params }) {
    const resolvedParams = await params;
    const slug = typeof resolvedParams?.slug === "string" ? resolvedParams.slug : undefined;

    if (!slug) {
        notFound();
    }

    return <OutletContent slug={slug} />;
}