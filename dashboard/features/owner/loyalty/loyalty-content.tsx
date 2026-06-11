"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader } from "@/components/ui/section-header";
import { useOutletStore } from "@/stores/outlet.store";
import { useOutletsQuery } from "@/hooks/use-outlets";
import { EmptyOutletState } from "@/components/ui/empty-outlet";
import { useRouter } from "next/navigation";
import { LoyaltySettings } from "./loyalty-settings";
import { LoyaltyMembersTable } from "./loyalty-members-table";
import { TierSettings } from "./tier-settings";
import { RewardCatalog } from "./reward-catalog";
import { LoyaltyDashboard } from "./loyalty-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Users,
  Settings,
  Trophy,
  Gift,
} from "lucide-react";

export default function LoyaltyContent() {
  const router = useRouter();
  const { selectedOutletId: outletId, isLoading: outletLoading } =
    useOutletStore();
  const { data: authData, isLoading: authLoading } = useOutletsQuery();

  if (outletLoading || authLoading) {
    return <LoyaltySkeleton />;
  }

  const hasOutlet = authData?.outlets && authData.outlets.length > 0;
  if (!hasOutlet && !outletId) {
    return (
      <EmptyOutletState onAddOutlet={() => router.push("/owner#add-outlet")} />
    );
  }

  const currentOutletName =
    authData?.outlets?.find((o) => o.id === outletId)?.name || "Outlet";

  const tabs = [
    { value: "dashboard", label: "Ringkasan", icon: BarChart3 },
    { value: "members", label: "Member", icon: Users },
    { value: "settings", label: "Pengaturan", icon: Settings },
    { value: "tiers", label: "Tier", icon: Trophy },
    { value: "rewards", label: "Reward", icon: Gift },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Loyalty & Poin"
        description={`Kelola program poin, tier membership, dan reward untuk ${currentOutletName}`}
      />

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="bg-muted/50 border border-border/40 p-1 rounded-md h-auto gap-1 w-full sm:w-auto flex-wrap">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-1.5 px-3 py-1.5 text-xs font-medium"
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard">
          <LoyaltyDashboard outletId={outletId!} />
        </TabsContent>

        <TabsContent value="members">
          <LoyaltyMembersTable outletId={outletId!} />
        </TabsContent>

        <TabsContent value="settings">
          <LoyaltySettings outletId={outletId!} />
        </TabsContent>

        <TabsContent value="tiers">
          <TierSettings outletId={outletId!} />
        </TabsContent>

        <TabsContent value="rewards">
          <RewardCatalog outletId={outletId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoyaltySkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 rounded-md" />
        <Skeleton className="h-4 w-80 rounded-md" />
      </div>
      <Skeleton className="h-10 w-full max-w-md rounded-md" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
