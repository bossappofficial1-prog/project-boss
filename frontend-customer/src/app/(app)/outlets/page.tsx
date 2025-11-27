import { Suspense } from "react";
import OutletsPage from "@/components/outlets/OutletsPage";
import { LoadingState } from "@/components/Base";

export default function OutletsRoute() {
    return (
        <Suspense fallback={<LoadingState message="Loading outlets..." />}>
            <OutletsPage />
        </Suspense>
    );
}
