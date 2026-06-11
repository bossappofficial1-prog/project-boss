"use client";

import { useAuth } from "@/features/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  Phone,
  Globe,
  Shield,
  Fingerprint,
  Clock,
  Building2,
  CreditCard,
  Calendar,
  Banknote,
  Settings,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { ProfileHero } from "./profile-hero";
import { ProfileInfoCard, InfoField, InfoGrid } from "./profile-info-card";

export const ProfileContent = () => {
  const { user, business, isLoading } = useAuth();

  if (isLoading || !user) {
    return <ProfileSkeleton />;
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Profil Saya"
        description="Informasi detail tentang akun dan bisnis Anda."
        icon={User}
      />

      {/* Hero Section */}
      <ProfileHero user={user} business={business} />

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contact Info */}
        <ProfileInfoCard
          title="Informasi Kontak"
          icon={Mail}
          description="Data komunikasi akun Anda"
          action={
            <Link href="/owner/settings">
              <Button variant="ghost" size="sm">
                Edit
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          }
        >
          <div className="divide-y divide-border/40">
            <InfoField
              icon={Mail}
              label="Email"
              value={user.email || "Belum ada email"}
              truncate
            />
            <InfoField
              icon={Phone}
              label="Telepon"
              value={user.phone || "Belum diatur"}
            />
            <InfoField
              icon={Globe}
              label="Metode Login"
              value={
                user.provider === "google"
                  ? "Google OAuth"
                  : "Email & Kata Sandi"
              }
              badge={
                user.provider === "google" ? (
                  <Badge
                    variant="outline"
                    className="text-[9px] font-bold uppercase tracking-wider border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                  >
                    Google
                  </Badge>
                ) : undefined
              }
            />
          </div>
        </ProfileInfoCard>

        {/* System Info */}
        <ProfileInfoCard
          title="Detail Sistem"
          icon={Shield}
          description="Identitas teknis akun Anda"
        >
          <div className="divide-y divide-border/40">
            <InfoField
              icon={Shield}
              label="Role"
              value={user.role?.toLowerCase() || "-"}
              badge={
                <Badge
                  variant="secondary"
                  className="text-[9px] font-bold uppercase tracking-wider"
                >
                  {user.role?.toLowerCase() || "-"}
                </Badge>
              }
            />
            <InfoField
              icon={Fingerprint}
              label="User ID"
              value={user.id || "-"}
              truncate
              mono
            />
            {user.sessionId && (
              <InfoField
                icon={Clock}
                label="Session ID"
                value={user.sessionId}
                truncate
                mono
              />
            )}
          </div>
        </ProfileInfoCard>

        {/* Business Info */}
        {business && (
          <ProfileInfoCard
            title="Bisnis"
            icon={Building2}
            description="Informasi usaha yang terhubung"
            action={
              <Link href="/owner/settings">
                <Button variant="ghost" size="sm">
                  Detail
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            }
          >
            <div className="divide-y divide-border/40">
              <InfoField
                icon={Building2}
                label="Nama Bisnis"
                value={business.name || "-"}
              />
              <InfoField
                icon={CreditCard}
                label="Paket Langganan"
                value={business.subscriptionPlan || "Basic"}
                badge={
                  <Badge
                    variant={
                      business.subscriptionStatus === "ACTIVE"
                        ? "default"
                        : "secondary"
                    }
                    className="text-[9px] font-bold uppercase tracking-wider"
                  >
                    {business.subscriptionStatus || "TIDAK AKTIF"}
                  </Badge>
                }
              />
              <InfoField
                icon={Calendar}
                label="Berakhir Pada"
                value={formatDate(business.subscriptionEndDate)}
              />
            </div>
          </ProfileInfoCard>
        )}

        {/* Bank Info */}
        {business?.bankName && (
          <ProfileInfoCard
            title="Rekening Bank"
            icon={Banknote}
            description="Rekening untuk menerima pembayaran"
          >
            <div className="divide-y divide-border/40">
              <InfoField
                icon={Building2}
                label="Bank"
                value={business.bankName || "-"}
              />
              <InfoField
                icon={CreditCard}
                label="Nomor Rekening"
                value={business.bankAccount || "-"}
                mono
              />
              <InfoField
                icon={User}
                label="Atas Nama"
                value={business.accountHolder || "-"}
              />
            </div>
          </ProfileInfoCard>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/owner/settings">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/60 bg-card hover:bg-muted/30 transition-colors group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Pengaturan Akun</p>
                <p className="text-xs text-muted-foreground">
                  Edit profil, password, dan preferensi
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        <Link href="/owner/subscription">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/60 bg-card hover:bg-muted/30 transition-colors group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Langganan</p>
                <p className="text-xs text-muted-foreground">
                  Kelola paket dan tagihan
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
      </div>
    </div>
  );
};

const ProfileSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-10 w-48 rounded-md" />
      <Skeleton className="h-5 w-64 rounded-md" />
    </div>

    {/* Hero skeleton */}
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <Skeleton className="h-28 md:h-36 w-full rounded-none" />
      <div className="px-5 md:px-8 pb-6 pt-0">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start -mt-12 md:-mt-14 mb-5">
          <Skeleton className="h-24 w-24 md:h-28 md:w-28 rounded-full border-4 border-background shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-7 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    </div>

    {/* Cards skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-lg" />
      ))}
    </div>
  </div>
);

export default ProfileContent;
