"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function SubscriptionSkeleton() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Detail Section Skeleton */}
            <div className="grid gap-4 lg:grid-cols-12">
                <Card className="lg:col-span-8 rounded-md border-border/80 bg-background p-6 space-y-6">
                    <div className="flex justify-between items-start">
                        <div className="space-y-3">
                            <Skeleton className="h-8 w-48 rounded-md" />
                            <Skeleton className="h-4 w-64 rounded-md opacity-50" />
                        </div>
                        <div className="text-right space-y-2">
                            <Skeleton className="h-3 w-20 ml-auto rounded-md" />
                            <Skeleton className="h-10 w-40 ml-auto rounded-md" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-16 rounded-md opacity-60" />
                        ))}
                    </div>
                    <Skeleton className="h-12 w-full rounded-md opacity-30" />
                </Card>
                <Card className="lg:col-span-4 rounded-md border-border/80 bg-background p-6 space-y-6">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-6 w-6 rounded-md shrink-0" />
                                <Skeleton className="h-4 w-full rounded-md opacity-40" />
                            </div>
                        ))}
                    </div>
                    <Skeleton className="h-11 w-full rounded-md" />
                </Card>
            </div>

            {/* Usage Grid Skeleton */}
            <div className="grid gap-4 md:grid-cols-3">
                {[...Array(3)].map((_, idx) => (
                    <Card key={idx} className="rounded-md border-border/80 bg-background p-5 space-y-4 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-16 rounded-md" />
                                <Skeleton className="h-8 w-24 rounded-md" />
                            </div>
                            <Skeleton className="h-10 w-10 rounded-md" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-md opacity-40" />
                        <div className="flex justify-between">
                            <Skeleton className="h-2 w-20 rounded-md opacity-30" />
                            <Skeleton className="h-3 w-12 rounded-md opacity-30" />
                        </div>
                    </Card>
                ))}
            </div>

            {/* Invoice/CTA Skeleton */}
            <Skeleton className="h-24 w-full rounded-md opacity-20" />
            
            {/* Table Skeleton */}
            <Card className="rounded-md border-border/80 bg-background overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border/40 bg-muted/30">
                    <Skeleton className="h-6 w-40 rounded-md" />
                </div>
                <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-md opacity-40" />
                    ))}
                </div>
            </Card>
        </div>
    );
}