export default function Loading() {
    return (
        <div className="animate-pulse">
            {/* Hero Image Skeleton */}
            <div className="relative h-72 sm:h-80 bg-muted -mx-3 -mt-3 rounded-b-2xl" />

            {/* Content Sheet */}
            <div className="z-40 rounded-t-2xl bg-background mb-12 -mx-3 p-0">
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
                </div>

                <div className="px-5 pb-6 space-y-5">
                    {/* Product Name + Price */}
                    <div className="space-y-2">
                        <div className="h-6 w-3/4 bg-muted rounded-md" />
                        <div className="h-4 w-1/2 bg-muted rounded-md" />
                        <div className="h-7 w-1/3 bg-muted rounded-md" />
                    </div>

                    {/* Detail Chips */}
                    <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-8 w-24 bg-muted rounded-full" />
                        ))}
                    </div>

                    {/* Outlet Card */}
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60">
                        <div className="h-10 w-10 bg-muted rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-16 bg-muted rounded-md" />
                            <div className="h-4 w-2/3 bg-muted rounded-md" />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <div className="h-5 w-24 bg-muted rounded-md" />
                        <div className="h-3 w-full bg-muted rounded-md" />
                        <div className="h-3 w-full bg-muted rounded-md" />
                        <div className="h-3 w-2/3 bg-muted rounded-md" />
                    </div>
                </div>
            </div>

            {/* Bottom Actions Skeleton */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
                <div className="flex gap-3 max-w-4xl mx-auto">
                    <div className="h-11 w-11 bg-muted rounded-md flex-shrink-0" />
                    <div className="h-11 flex-1 bg-muted rounded-md" />
                </div>
            </div>
        </div>
    );
}
