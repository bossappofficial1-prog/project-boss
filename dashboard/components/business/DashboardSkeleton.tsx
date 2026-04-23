"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* KPI Skeleton */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-24 w-full rounded-md border border-border/40 bg-card p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-md" />
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                <Skeleton className="h-[450px] rounded-md xl:col-span-2 shadow-sm border border-border/40" />
                <Skeleton className="h-[450px] rounded-md shadow-sm border border-border/40" />
            </div>

            {/* Performance Row */}
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                <Skeleton className="h-[450px] rounded-md xl:col-span-2 shadow-sm border border-border/40" />
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-[215px] rounded-md shadow-sm border border-border/40" />
                    <Skeleton className="h-[215px] rounded-md shadow-sm border border-border/40" />
                </div>
            </div>

            {/* Tables Skeleton */}
            <Skeleton className="h-[400px] rounded-md shadow-sm border border-border/40" />
            <Skeleton className="h-[400px] rounded-md shadow-sm border border-border/40" />
        </div>
    );
}
