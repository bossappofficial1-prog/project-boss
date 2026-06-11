"use client";

import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth";
import { SectionHeader } from "@/components/ui/section-header";
import { SettingsNav, SettingsSection } from "./settings-nav";
import {
  ProfileSection,
  SecuritySection,
  BusinessSection,
  AppearanceSection,
  IntegrationsSection,
  SubscriptionSection,
} from "./sections";
import { Settings } from "lucide-react";

export function SettingsContent() {
  const { user, business, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");

  const isLocalAuth = user?.provider === "local";
  const hasBusiness = Boolean(business?.name);
  const subscriptionPlan = business?.subscriptionPlan || "BASIC";

  if (isLoading || !user) {
    return <SettingsSkeleton />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileSection user={user} />;
      case "security":
        return <SecuritySection userId={user.id} provider={user.provider} />;
      case "business":
        return <BusinessSection business={business} />;
      case "appearance":
        return <AppearanceSection />;
      case "integrations":
        return <IntegrationsSection subscriptionPlan={subscriptionPlan} />;
      case "subscription":
        return <SubscriptionSection business={business} />;
      default:
        return <ProfileSection user={user} />;
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Pengaturan"
        description="Kelola akun, bisnis, dan preferensi sistem Anda."
        icon={Settings}
      />

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <SettingsNav
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isLocalAuth={isLocalAuth}
          hasBusiness={hasBusiness}
        />

        <div className="flex-1 min-w-0 w-full md:w-auto animate-in fade-in-0 duration-200">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48 rounded-md" />
        <Skeleton className="h-5 w-96 rounded-md" />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Nav skeleton */}
        <div className="hidden md:flex flex-col gap-2 w-56 lg:w-64">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
        <div className="flex md:hidden gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-lg shrink-0" />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default SettingsContent;
