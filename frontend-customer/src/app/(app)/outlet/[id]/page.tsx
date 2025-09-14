import { OutletContent } from "@/components/outlet/OutletContent";
type Params = Promise<{ id: string }>;

export default async function Page({ params }: { params: Params }) {
    const { id } = await params;

    return <OutletContent outletId={id} />
}