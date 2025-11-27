import { notFound } from "next/navigation";
import { OutletContent } from "@/components/outlet/OutletContent";

type Params = Promise<{ id?: string }>;

export default async function Page({ params }: { params: Params }) {
    const resolvedParams = await params;
    const id = typeof resolvedParams?.id === "string" ? resolvedParams.id : undefined;

    if (!id) {
        notFound();
    }

    return <OutletContent outletId={id} />;
}