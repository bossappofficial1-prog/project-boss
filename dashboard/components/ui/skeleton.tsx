'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn('animate-pulse rounded-md bg-gray-200 dark:bg-gray-700', className)}
            {...props}
        />
    );
}

// Dashboard-specific skeleton components
export function DashboardCardSkeleton() {
    return (
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <div className="mt-4">
                <Skeleton className="h-3 w-32" />
            </div>
        </div>
    );
}

export function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
    return (
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-24" />
                </div>
                <Skeleton className={cn('w-full rounded-md', height)} />
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>
        </div>
    );
}

export function ActivityListSkeleton({ items = 5 }: { items?: number }) {
    return (
        <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-3">
                    {Array.from({ length: items }).map((_, i) => (
                        <div key={i} className="flex items-start space-x-3">
                            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function HeaderSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                    <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
    );
}

export { Skeleton };