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
            <div className="space-y-6 animate-pulse">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64 bg-muted/30" />
                    <Skeleton className="h-4 w-96 bg-muted/20" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full max-w-md bg-muted/20" />
                    <div className="rounded-md border border-border/40 p-1 space-y-4">
                        <div className="flex items-center justify-between p-4 border-b border-border/40">
                            <Skeleton className="h-6 w-32 bg-muted/20" />
                            <Skeleton className="h-9 w-64 bg-muted/20" />
                        </div>
                        <div className="p-4 space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full bg-muted/10 rounded-md" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const hasOutlet = authData?.outlets && authData.outlets.length > 0;
    if (!hasOutlet && !outletId) {
        return <EmptyOutletState onAddOutlet={() => router.push(`/owner/dashboard#add-outlet`)} />;
    }

    const currentOutletName = authData?.outlets?.find((o) => o.id === outletId)?.name || "Outlet";

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Loyalty & Poin"
                description={`Kelola program poin, tier membership, dan basis data keanggotaan untuk ${currentOutletName}`}
            />

            <Tabs defaultValue="members" className="space-y-4">
                <TabsList className="bg-muted/50 border border-border/40 p-1 rounded-md h-auto gap-1 w-full sm:w-auto">
                    <TabsTrigger value="members" className="gap-2 px-4 py-1.5 font-bold uppercase tracking-widest text-[10px]">
                        Daftar Member
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2 px-4 py-1.5 font-bold uppercase tracking-widest text-[10px]">
                        Pengaturan Poin
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="mt-6">
                    <LoyaltyMembersTable outletId={outletId!} />
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                    <LoyaltySettings outletId={outletId!} />
                </TabsContent>
            </Tabs>
        </div >
    );
}
