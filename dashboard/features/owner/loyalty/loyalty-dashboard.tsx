"use client";

import { useState } from "react";
import { useLoyaltyDashboard } from "@/hooks/api/use-loyalty";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Users,
  Trophy,
  Gift,
  DollarSign,
  Award,
  ShieldAlert,
  Clock,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { gooeyToast } from "goey-toast";
import { apiClient } from "@/lib/apis/base";

export function LoyaltyDashboard({ outletId }: { outletId: string }) {
  const { data, isLoading, isError } = useLoyaltyDashboard(outletId);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportRedemptions = async () => {
    try {
      setIsExporting(true);
      const response = await apiClient.get(
        `/loyalty/redemptions/${outletId}/export`,
        { responseType: "blob" }
      );
      const blob = new Blob([response.data], {
        type: "text/csv; charset=utf-8",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `loyalty-redemptions-${outletId}-${Date.now()}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      gooeyToast.success("Berhasil mengunduh data penukaran");
    } catch {
      gooeyToast.error("Gagal mengunduh data penukaran");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3 rounded-lg border border-dashed border-border">
        <ShieldAlert className="h-8 w-8 text-destructive/40" />
        <p className="text-sm text-muted-foreground">
          Gagal memuat analitik loyalty
        </p>
      </div>
    );
  }

  const { stats, tierBreakdown, recentRedemptions, topMembers } = data;

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Users}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
          label="Total Member"
          value={stats.totalMembers.toLocaleString("id-ID")}
          sub="Pelanggan terdaftar"
        />
        <StatCard
          icon={Trophy}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-500"
          label="Poin Beredar"
          value={stats.totalActivePoints.toLocaleString("id-ID")}
          sub="Poin aktif di member"
        />
        <StatCard
          icon={Gift}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-500"
          label="Ditukarkan"
          value={stats.totalRedeemedPoints.toLocaleString("id-ID")}
          sub="Poin diklaim reward"
        />
        <StatCard
          icon={DollarSign}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          label="Omzet Member"
          value={`Rp ${stats.totalMemberSpending.toLocaleString("id-ID")}`}
          sub="Total belanja member"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top Members */}
        <Card className="shadow-sm border-border/60 gap-0 py-0">
          <CardHeader className="border-b border-border/40 bg-muted/10 p-4">
            <CardTitle className="text-sm font-semibold">
              Top Member Aktif
            </CardTitle>
            <CardDescription className="text-xs">
              Member dengan poin aktif tertinggi
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {topMembers.length === 0 ? (
              <EmptyState text="Belum ada data member" />
            ) : (
              topMembers.map((member, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {member.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className="text-[9px] font-bold uppercase"
                      style={{
                        borderColor: member.tierColor + "40",
                        backgroundColor: member.tierColor + "10",
                        color: member.tierColor,
                      }}
                    >
                      {member.tierName}
                    </Badge>
                    <span className="text-xs font-bold text-primary tabular-nums">
                      {member.points.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Redemptions */}
        <Card className="shadow-sm border-border/60 gap-0 py-0">
          <CardHeader className="border-b border-border/40 bg-muted/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Aktivitas Penukaran
                </CardTitle>
                <CardDescription className="text-xs">
                  Log penukaran reward terbaru
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportRedemptions}
                disabled={isExporting || recentRedemptions.length === 0}
              >
                <Download className="h-3.5 w-3.5" />
                {isExporting ? "..." : "Ekspor"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {recentRedemptions.length === 0 ? (
              <EmptyState text="Belum ada penukaran reward" icon={Gift} />
            ) : (
              recentRedemptions.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between p-2.5 rounded-lg border border-border/40 bg-muted/10 gap-3"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1.5 rounded bg-muted shrink-0">
                      <Award className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">
                        {r.rewardName}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {r.customerName} ({r.customerPhone})
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {format(new Date(r.createdAt), "d MMM HH:mm", {
                          locale: localeId,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-rose-500 tabular-nums">
                      -{r.pointsUsed} Poin
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold uppercase mt-1 ${
                        r.status === "USED"
                          ? "text-emerald-600 border-emerald-500/30"
                          : r.status === "PENDING"
                            ? "text-amber-600 border-amber-500/30"
                            : "text-muted-foreground"
                      }`}
                    >
                      {r.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tier Distribution */}
      {tierBreakdown.length > 0 && (
        <Card className="shadow-sm border-border/60 gap-0 py-0">
          <CardHeader className="border-b border-border/40 bg-muted/10 p-4">
            <CardTitle className="text-sm font-semibold">
              Distribusi Tier
            </CardTitle>
            <CardDescription className="text-xs">
              Penyebaran member berdasarkan tier
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            {tierBreakdown.map((tier, i) => {
              const percent =
                stats.totalMembers > 0
                  ? (tier.count / stats.totalMembers) * 100
                  : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: tier.color }}
                      />
                      {tier.name}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {tier.count} ({percent.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: tier.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="shadow-sm border-border/60 gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </CardTitle>
        <div className={`p-1.5 rounded-md ${iconBg}`}>
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="text-lg font-bold tabular-nums">{value}</div>
        <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  text,
  icon: Icon,
}: {
  text: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="py-8 text-center flex flex-col items-center gap-2">
      {Icon && <Icon className="h-8 w-8 text-muted-foreground/20" />}
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}
