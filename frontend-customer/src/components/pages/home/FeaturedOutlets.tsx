"use client"

import React from "react";
import { useFeaturedOutlets } from '@/hooks/useFeaturedOutlets';
import { OutletCard } from "./OutletCard";

export default function FeaturedOutlets() {
    // Postman base_url suggests /outlets/featured
    const { data: items, isLoading, isError } = useFeaturedOutlets();

    if (isLoading) {
        return (
            <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 snap-x snap-mandatory">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-[300px] flex-none h-48 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse snap-center" />
                ))}
            </div>
        );
    }

    if (isError) {
        return <div className="text-sm text-red-600">Unable to load featured outlets. Please try again.</div>;
    }

    if (!items || items.length === 0) {
        return <div className="text-sm text-gray-600">No featured outlets available.</div>;
    }

    return (
        <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 snap-x snap-mandatory">
            {items.slice(0, 6).map((o: any) => (
                <div key={o.id} className="w-[300px] flex-none snap-center">
                    <OutletCard
                        outlet={o as any}
                    />
                </div>
            ))}
        </div>
    );
}
