import { LoadingState } from "@/components/Base";
import { NearbyOutletContent } from "@/components/pages/nearby/NearbyContent";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: 'Outlet Terdekat'
}

export default function NearbyOutletPage() {
    return (
        <Suspense fallback={<LoadingState message="Loading nearby page..." />}>
            <NearbyOutletContent />
        </Suspense>
    );
}