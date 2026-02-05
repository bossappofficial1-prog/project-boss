import { Skeleton } from "@/components/ui/skeleton";

export function SubscriptionSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <Skeleton className="h-64 rounded-3xl" />
                <Skeleton className="h-64 rounded-3xl" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                {[...Array(3)].map((_, idx) => (
                    <Skeleton key={idx} className="h-40 rounded-3xl" />
                ))}
            </div>
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-72 rounded-3xl" />
        </div>
    );
}