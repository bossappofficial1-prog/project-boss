"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Settings,
  ExternalLink,
  Shield,
  Calendar,
} from "lucide-react";
import Link from "next/link";

interface ProfileHeroProps {
  user: {
    name?: string;
    email?: string;
    avatar?: string;
    phone?: string;
    role?: string;
    isVerified?: boolean;
    provider?: string;
    createdAt?: string;
  };
  business?: {
    name?: string;
    subscriptionPlan?: string;
    subscriptionStatus?: string;
  } | null;
}

export function ProfileHero({ user, business }: ProfileHeroProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
      })
    : null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      {/* Banner */}
      <div className="h-28 md:h-36 bg-linear-to-br from-primary/20 via-primary/10 to-transparent" />

      <div className="px-5 md:px-8 pb-6 pt-0">
        {/* Avatar + Info */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start -mt-12 md:-mt-14 mb-5">
          <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-background shadow-lg bg-muted shrink-0">
            <AvatarImage
              src={user.avatar || ""}
              alt={user.name || "User"}
              className="object-cover"
            />
            <AvatarFallback className="text-2xl md:text-3xl font-bold text-primary">
              {getInitials(user.name || "U")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-1.5">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground truncate">
                  {user.name || "Pengguna Tanpa Nama"}
                </h1>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5"
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {user.role?.toLowerCase() || "user"}
                  </Badge>

                  {user.isVerified && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Terverifikasi
                    </Badge>
                  )}

                  {business?.subscriptionPlan && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
                    >
                      {business.subscriptionPlan}
                    </Badge>
                  )}
                </div>

                {memberSince && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Bergabung {memberSince}
                  </p>
                )}
              </div>

              <Link href="/owner/settings">
                <Button variant="outline" size="sm">
                  <Settings className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit Profil</span>
                  <span className="sm:hidden">Edit</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickStat label="Email" value={user.email || "-"} truncate />
          <QuickStat label="Telepon" value={user.phone || "Belum diatur"} />
          <QuickStat
            label="Login via"
            value={user.provider === "google" ? "Google" : "Email"}
          />
          <QuickStat label="Bisnis" value={business?.name || "Belum ada"} />
        </div>
      </div>
    </div>
  );
}

function QuickStat({
  label,
  value,
  truncate = false,
}: {
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
        {label}
      </p>
      <p
        className={`text-sm font-semibold text-foreground mt-0.5 ${truncate ? "truncate" : ""}`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}
