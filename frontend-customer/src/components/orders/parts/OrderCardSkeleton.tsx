import { Skeleton } from "@/components/ui/skeleton";

export default function OrderCardSkeleton() {
    return (
        <div className="rounded-md border bg-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-3 pt-3 pb-2">
                <Skeleton className="h-7 w-7 rounded-md" />
                <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-4 w-4 rounded" />
            </div>

            {/* Status badge */}
            <div className="px-3 pb-2">
                <Skeleton className="h-5 w-28 rounded-full" />
            </div>

            {/* Items */}
            <div className="px-3 pb-2 space-y-1.5">
                <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-3/5" />
                    <Skeleton className="h-3.5 w-16" />
                </div>
                <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-2/5" />
                    <Skeleton className="h-3.5 w-14" />
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/30">
                <Skeleton className="h-3 w-20" />
                <div className="text-right space-y-1">
                    <Skeleton className="h-2.5 w-10 ml-auto" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>

            {/* Actions */}
            <div className="px-3 pb-3 pt-1 flex gap-2">
                <Skeleton className="h-8 flex-1 rounded-md" />
                <Skeleton className="h-8 flex-1 rounded-md" />
            </div>
        </div>
    );
}
