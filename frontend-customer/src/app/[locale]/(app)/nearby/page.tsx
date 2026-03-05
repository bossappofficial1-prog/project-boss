'use client'

import { LoadingState } from "@/components/Base";
import { NearbyOutletContent } from "@/components/pages/nearby/NearbyContent";
import { Suspense, useEffect } from "react";

export default function NearbyOutletPage() {
    useEffect(() => {
        document.title = 'Outlet Terdekat'
    }, [])
    return (
        <Suspense fallback={<LoadingState message="Loading nearby page..." />}>
            <NearbyOutletContent />
        </Suspense>
    );
}