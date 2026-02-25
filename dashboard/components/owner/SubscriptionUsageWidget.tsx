'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertCircle, Store, Package, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/apis/base';
import { useQuery } from '@tanstack/react-query';

interface UsageData {
    usage: {
        outlets: number;
        products: number;
        staff: number;
    };
    limits: {
        outlets: number;
        products: number;
        staff: number;
    };
    plan: string;
    status: string;
    endDate: string | null;
}

export function SubscriptionUsageWidget() {
    const router = useRouter();
    
    const { data: usageData, isLoading } = useQuery<UsageData>({
        queryKey: ['usage-statistics'],
        queryFn: async () => {
            const response = await apiClient.get('/business/usage-statistics');
            return response.data.data;
        },
    });

    const getPercentage = (used: number, limit: number) => {
        if (limit === -1) return 0; // Unlimited
        return (used / limit) * 100;
    };

    const isNearLimit = (used: number, limit: number) => {
        if (limit === -1) return false;
        return (used / limit) >= 0.8; // 80% threshold
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!usageData) return null;

    const daysUntilExpiry = usageData.endDate
        ? Math.ceil((new Date(usageData.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Penggunaan Paket</CardTitle>
                        <CardDescription>
                            Paket: <span className="font-semibold">{usageData.plan}</span>
                            {daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
                                <span className="ml-2 text-red-500">
                                    • Berakhir dalam {daysUntilExpiry} hari
                                </span>
                            )}
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/owner/subscription')}
                    >
                        Kelola
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Outlets */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Outlet</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {usageData.usage.outlets} / {usageData.limits.outlets === -1 ? '∞' : usageData.limits.outlets}
                        </span>
                    </div>
                    {usageData.limits.outlets !== -1 && (
                        <div className="space-y-1">
                            <Progress
                                value={getPercentage(usageData.usage.outlets, usageData.limits.outlets)}
                                className={isNearLimit(usageData.usage.outlets, usageData.limits.outlets) ? 'bg-red-200' : ''}
                            />
                            {isNearLimit(usageData.usage.outlets, usageData.limits.outlets) && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Mendekati batas
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Products */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Produk</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {usageData.usage.products} / {usageData.limits.products === -1 ? '∞' : usageData.limits.products}
                        </span>
                    </div>
                    {usageData.limits.products !== -1 && (
                        <div className="space-y-1">
                            <Progress
                                value={getPercentage(usageData.usage.products, usageData.limits.products)}
                                className={isNearLimit(usageData.usage.products, usageData.limits.products) ? 'bg-red-200' : ''}
                            />
                            {isNearLimit(usageData.usage.products, usageData.limits.products) && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Mendekati batas
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Staff */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Staff</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {usageData.usage.staff} / {usageData.limits.staff === -1 ? '∞' : usageData.limits.staff}
                        </span>
                    </div>
                    {usageData.limits.staff !== -1 && (
                        <div className="space-y-1">
                            <Progress
                                value={getPercentage(usageData.usage.staff, usageData.limits.staff)}
                                className={isNearLimit(usageData.usage.staff, usageData.limits.staff) ? 'bg-red-200' : ''}
                            />
                            {isNearLimit(usageData.usage.staff, usageData.limits.staff) && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Mendekati batas
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
