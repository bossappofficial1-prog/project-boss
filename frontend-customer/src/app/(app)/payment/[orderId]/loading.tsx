export default function PaymentDetailLoading() {
    return (
        <div className="space-y-3 animate-pulse">
            {/* Status Banner Skeleton */}
            <div className="rounded-md border p-3 flex items-start gap-3 bg-muted/20">
                <div className="w-5 h-5 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/5 bg-muted rounded" />
                    <div className="h-3 w-4/5 bg-muted rounded" />
                </div>
            </div>

            {/* Payment Overview Skeleton */}
            <div className="rounded-md border overflow-hidden">
                <div className="px-3 py-2.5 bg-muted/30 flex justify-between">
                    <div className="h-3 w-16 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                </div>
                <div className="px-3 py-2.5 space-y-3">
                    <div className="flex justify-between">
                        <div className="h-3 w-28 bg-muted rounded" />
                        <div className="h-3 w-20 bg-muted rounded" />
                    </div>
                    <div className="flex justify-between">
                        <div className="h-3 w-20 bg-muted rounded" />
                        <div className="h-5 w-28 bg-muted rounded" />
                    </div>
                </div>
            </div>

            {/* Payment Details Skeleton */}
            <div className="rounded-md border p-4 space-y-3">
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-2/3 bg-muted rounded" />
                <div className="h-32 w-32 mx-auto bg-muted rounded-md" />
            </div>

            {/* Order Items Skeleton */}
            <div className="rounded-md border overflow-hidden">
                <div className="px-3 py-2.5 bg-muted/30">
                    <div className="h-3 w-28 bg-muted rounded" />
                </div>
                {[1, 2].map((i) => (
                    <div key={i} className="px-3 py-2.5 border-t flex justify-between">
                        <div className="space-y-1.5 flex-1">
                            <div className="h-3.5 w-32 bg-muted rounded" />
                            <div className="h-2.5 w-20 bg-muted rounded" />
                        </div>
                        <div className="h-3.5 w-16 bg-muted rounded" />
                    </div>
                ))}
                <div className="border-t px-3 py-2.5 space-y-2">
                    <div className="flex justify-between">
                        <div className="h-3 w-16 bg-muted rounded" />
                        <div className="h-3 w-20 bg-muted rounded" />
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between">
                        <div className="h-4 w-12 bg-muted rounded" />
                        <div className="h-4 w-24 bg-muted rounded" />
                    </div>
                </div>
            </div>

            {/* Customer Info Skeleton */}
            <div className="rounded-md border px-3 py-2.5 space-y-2">
                <div className="flex justify-between">
                    <div className="h-3 w-12 bg-muted rounded" />
                    <div className="h-3 w-28 bg-muted rounded" />
                </div>
                <div className="flex justify-between">
                    <div className="h-3 w-16 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                </div>
            </div>
        </div>
    );
}
