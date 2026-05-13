export default function Loading() {
    return (
        <div className="pb-20 animate-pulse">
            {/* Hero Image Skeleton */}
            <div className="relative h-52 sm:h-64 bg-muted -mx-3 -mt-3 rounded-b-2xl" />

            {/* Outlet Info Skeleton */}
            <div className="relative -mt-8 px-1 space-y-3">
                {/* Name + Badge */}
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                        <div className="h-6 w-3/4 bg-muted rounded-md" />
                        <div className="h-4 w-1/2 bg-muted rounded-md" />
                    </div>
                    <div className="h-8 w-20 bg-muted rounded-full" />
                </div>

                {/* Address */}
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted rounded" />
                    <div className="h-4 w-2/3 bg-muted rounded-md" />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    <div className="h-9 w-24 bg-muted rounded-full" />
                    <div className="h-9 w-24 bg-muted rounded-full" />
                    <div className="h-9 w-24 bg-muted rounded-full" />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="mt-6 space-y-4">
                <div className="flex gap-2 border-b pb-2">
                    <div className="h-8 w-20 bg-muted rounded-md" />
                    <div className="h-8 w-20 bg-muted rounded-md" />
                    <div className="h-8 w-20 bg-muted rounded-md" />
                </div>

                {/* Product Cards Skeleton */}
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-xl border border-border/40">
                            <div className="h-20 w-20 bg-muted rounded-lg flex-shrink-0" />
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-4 w-3/4 bg-muted rounded-md" />
                                <div className="h-3 w-1/2 bg-muted rounded-md" />
                                <div className="h-4 w-1/3 bg-muted rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
