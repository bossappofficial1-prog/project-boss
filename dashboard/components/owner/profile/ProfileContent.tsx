"use client";

import React from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Fingerprint,
  Mail,
  Phone,
  Shield,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";

export const ProfileContent = () => {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return <ProfileSkeleton />;
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <>
      {/* Header */}
      <SectionHeader
        title="Profil Saya"
        description="Lihat detail informasi dan identitas akun Anda."
      />

      <Card className="overflow-hidden mt-4 border-border/60 py-0 shadow-sm">
        {/* Banner */}
        <div className="h-24 md:h-32 bg-linear-to-r from-primary/10 via-primary/5 to-transparent border-b" />

        <CardContent className="relative px-4 md:px-10 pb-6 md:pb-8 pt-0">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-start sm:items-end -mt-10 md:-mt-12 mb-6 md:mb-8">
            <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-background shadow-md bg-muted">
              <AvatarImage
                src={user.avatar || ""}
                alt={user.name}
                className="object-cover"
              />
              <AvatarFallback className="text-lg md:text-2xl font-semibold text-primary">
                {getInitials(user.name || "User")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-1">
              <h2 className="text-lg md:text-2xl font-bold text-foreground">
                {user.name || "Pengguna Tanpa Nama"}
              </h2>

              <Badge
                variant="secondary"
                className="capitalize text-xs md:text-sm px-2 md:px-3 py-0.5"
              >
                {user.role?.toLowerCase() || "user"}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* LEFT */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Informasi Kontak
              </h3>

              <InfoItem
                icon={<Mail className="h-4 w-4 md:h-5 md:w-5" />}
                label="Alamat Email"
                value={user.email || "Belum ada email"}
              />

              <InfoItem
                icon={<Phone className="h-4 w-4 md:h-5 md:w-5" />}
                label="Nomor Telepon"
                value={user.phone || "Belum ada nomor telepon"}
              />
            </div>

            {/* RIGHT */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Detail Sistem
              </h3>

              <InfoItem
                icon={<Shield className="h-4 w-4 md:h-5 md:w-5" />}
                label="Hak Akses (Role)"
                value={user.role?.toLowerCase() || "-"}
              />

              <InfoItem
                icon={<Fingerprint className="h-4 w-4 md:h-5 md:w-5" />}
                label="ID Pengguna"
                value={user.id || "-"}
                truncate
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

const InfoItem = ({
  icon,
  label,
  value,
  truncate = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  truncate?: boolean;
}) => {
  return (
    <div className="flex items-center gap-3 md:gap-4 rounded-lg md:rounded-xl border p-3 md:p-4 bg-card hover:bg-muted/30 transition-colors">
      <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>

      <div className="overflow-hidden">
        <p
          className={`text-sm md:text-base font-semibold text-foreground ${truncate ? "truncate max-w-45 md:max-w-full" : ""
            }`}
          title={value}
        >
          {value}
        </p>
        <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">
          {label}
        </p>
      </div>
    </div>
  );
};

const ProfileSkeleton = () => (
  <div className="mx-auto max-w-4xl space-y-6 pb-10 px-4 md:px-0">
    <div className="space-y-2">
      <Skeleton className="h-6 md:h-10 w-40 md:w-48" />
      <Skeleton className="h-4 md:h-5 w-56 md:w-64" />
    </div>

    <Card className="rounded-xl overflow-hidden border-border/60">
      <Skeleton className="h-24 md:h-32 w-full rounded-none" />

      <CardContent className="px-4 md:px-10 pb-6 md:pb-8 pt-0">
        <div className="flex gap-4 md:gap-6 items-end -mt-10 md:-mt-12 mb-6 md:mb-8">
          <Skeleton className="h-20 w-20 md:h-24 md:w-24 rounded-full border-4 border-background shrink-0" />

          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 md:h-8 w-40 md:w-48" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-16 md:h-20 w-full rounded-xl" />
            <Skeleton className="h-16 md:h-20 w-full rounded-xl" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-16 md:h-20 w-full rounded-xl" />
            <Skeleton className="h-16 md:h-20 w-full rounded-xl" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);