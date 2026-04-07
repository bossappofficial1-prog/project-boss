"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader } from "@/components/ui/section-header";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { useOutletsQuery } from "@/hooks/useOutlets";
import { EmptyOutletState } from "@/components/ui/empty-outlet";
import { useRouter } from "next/navigation";
import { LoyaltySettings } from "./LoyaltySettings";
import { LoyaltyMembersTable } from "./LoyaltyMembersTable";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoyaltyContent() {
    const router = useRouter();
    const { selectedOutletId: outletId, isLoading: outletLoading } = useOutletContext();
    const { data: authData, isLoading: authLoading } = useOutletsQuery();

    if (outletLoading || authLoading) {
        return (
            <div className="space-y-6 p-6">
                <Skeleton className="h-10 w-1/4" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    const hasOutlet = authData?.outlets && authData.outlets.length > 0;
    if (!hasOutlet && !outletId) {
        return <EmptyOutletState onAddOutlet={() => router.push(`/owner/dashboard#add-outlet`)} />;
    }

    const currentOutletName = authData?.outlets?.find((o) => o.id === outletId)?.name || "Outlet";

    return (
        <>
            <SectionHeader
                title="Loyalty & Poin"
                description={`Kelola program poin dan keanggotaan untuk ${currentOutletName}`}
            />

            <Tabs defaultValue="members" className="w-full">
                <TabsList className="grid w-full max-w-[400px] mt-4 grid-cols-2">
                    <TabsTrigger value="members">Daftar Member</TabsTrigger>
                    <TabsTrigger value="settings">Pengaturan Poin</TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="mt-6">
                    <LoyaltyMembersTable outletId={outletId!} />
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                    <LoyaltySettings outletId={outletId!} />
                </TabsContent>
            </Tabs>
        </ >
    );
}
