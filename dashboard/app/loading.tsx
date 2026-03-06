import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="flex h-full flex-col space-y-4 p-4 md:p-6">
            <Skeleton className="h-10 w-1/3 rounded-md" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-md" />
                ))}
            </div>
            <Skeleton className="h-[calc(100vh-200px)] w-full rounded-md" />
        </div>
    );
}