"use client";

import React from "react";
import { useLoyaltyDashboard } from "@/hooks/api/use-loyalty";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Trophy, Gift, DollarSign, ArrowUpRight, Award, ShieldAlert, CheckCircle2, Clock, Download } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiClient } from "@/lib/apis/base";

export function LoyaltyDashboard({ outletId }: { outletId: string }) {
    const { data, isLoading, isError } = useLoyaltyDashboard(outletId);
    const [isExporting, setIsExporting] = React.useState(false);

    const handleExportRedemptions = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            setIsExporting(true);
            const response = await apiClient.get(`/loyalty/redemptions/${outletId}/export`, {
                responseType: "blob",
            });
            const blob = new Blob([response.data], { type: "text/csv; charset=utf-8" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `loyalty-redemptions-export-${outletId}-${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Berhasil mengunduh data penukaran");
        } catch (error) {
            toast.error("Gagal mengunduh data penukaran");
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="animate-pulse pb-0 gap-0">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <Skeleton className="h-4 w-24 bg-muted/30" />
                                <Skeleton className="h-4 w-4 rounded-full bg-muted/30" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16 mb-1 bg-muted/20" />
                                <Skeleton className="h-3 w-32 bg-muted/10" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="animate-pulse pb-0 gap-0">
                        <CardHeader><Skeleton className="h-6 w-48 bg-muted/30" /></CardHeader>
                        <CardContent className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full bg-muted/10 rounded" />
                            ))}
                        </CardContent>
                    </Card>
                    <Card className="animate-pulse pb-0 gap-0">
                        <CardHeader><Skeleton className="h-6 w-48 bg-muted/30" /></CardHeader>
                        <CardContent className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full bg-muted/10 rounded" />
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3 rounded-lg border border-dashed border-border">
                <ShieldAlert className="h-10 w-10 text-destructive/40" />
                <p className="text-sm font-semibold text-muted-foreground/60">Gagal memuat analitik loyalty</p>
            </div>
        );
    }

    const { stats, tierBreakdown, recentRedemptions, topMembers } = data;

    // Calculate percentages for tier distribution
    const maxCount = Math.max(...tierBreakdown.map((t) => t.count), 1);

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-card border border-border shadow-sm pb-0 gap-0">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Member</CardTitle>
                        <div className="p-1.5 rounded-full bg-blue-500/10 text-blue-500">
                            <Users className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-2xl font-black tracking-tight text-foreground">{stats.totalMembers.toLocaleString("id-ID")}</div>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wider">Pelanggan setia terdaftar</p>
                    </CardContent>
                </Card>

                <Card className="bg-card border border-border shadow-sm pb-0 gap-0">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Poin Beredar</CardTitle>
                        <div className="p-1.5 rounded-full bg-amber-500/10 text-amber-500">
                            <Trophy className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-2xl font-black tracking-tight text-foreground">{stats.totalActivePoints.toLocaleString("id-ID")}</div>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wider">Poin aktif di tangan member</p>
                    </CardContent>
                </Card>

                <Card className="bg-card border border-border shadow-sm pb-0 gap-0">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Ditukarkan</CardTitle>
                        <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-500">
                            <Gift className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-2xl font-black tracking-tight text-foreground">{stats.totalRedeemedPoints.toLocaleString("id-ID")}</div>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wider">Akumulasi poin diklaim reward</p>
                    </CardContent>
                </Card>

                <Card className="bg-card border border-border shadow-sm pb-0 gap-0">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Omzet dari Member</CardTitle>
                        <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="text-2xl font-black tracking-tight text-foreground">
                            Rp {stats.totalMemberSpending.toLocaleString("id-ID")}
                        </div>
                        <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wider">Total belanja seluruh member</p>
                    </CardContent>
                </Card>
            </div>

            {/* Split Sections */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Left Column: Top Members & Tiers */}
                <div className="space-y-6">
                    {/* Top Members */}
                    <Card className="border border-border shadow-sm pb-0 gap-0">
                        <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">Top Member Teraktif</CardTitle>
                            <CardDescription className="text-[10px] uppercase tracking-tighter">Anggota loyalitas dengan perolehan poin aktif tertinggi.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {topMembers.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic text-center py-6">Belum ada data member.</p>
                            ) : (
                                topMembers.map((member, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/30 transition-all">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-black text-xs">
                                                {index + 1}
                                            </span>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-foreground">{member.name}</span>
                                                <span className="text-[9px] font-semibold text-muted-foreground/60 tracking-wider font-mono">{member.phone}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                variant="outline"
                                                className="font-bold text-[8px] uppercase tracking-wider px-1.5 py-0 shadow-none border-0"
                                                style={{
                                                    borderColor: member.tierColor + "40",
                                                    backgroundColor: member.tierColor + "10",
                                                    color: member.tierColor
                                                }}
                                            >
                                                {member.tierName}
                                            </Badge>
                                            <div className="text-right">
                                                <div className="text-xs font-black text-primary tabular-nums">{member.points.toLocaleString("id-ID")} Poin</div>
                                                <div className="text-[8px] text-muted-foreground/60 uppercase tracking-tighter">Lifetime: {member.lifetimePoints.toLocaleString("id-ID")}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Tier Distribution */}
                    <Card className="border border-border shadow-sm pb-0 gap-0">
                        <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">Distribusi Tier Keanggotaan</CardTitle>
                            <CardDescription className="text-[10px] uppercase tracking-tighter">Penyebaran member aktif berdasarkan tingkatan tier saat ini.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {tierBreakdown.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic text-center py-6">Belum ada data tier.</p>
                            ) : (
                                tierBreakdown.map((tier, index) => {
                                    const percent = stats.totalMembers > 0 ? (tier.count / stats.totalMembers) * 100 : 0;
                                    return (
                                        <div key={index} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-bold">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tier.color }} />
                                                    {tier.name}
                                                </span>
                                                <span className="text-muted-foreground tabular-nums">
                                                    {tier.count.toLocaleString("id-ID")} Member ({percent.toFixed(0)}%)
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${percent}%`,
                                                        backgroundColor: tier.color
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Recent Redemptions */}
                <Card className="border border-border shadow-sm h-fit pb-0 gap-0">
                    <CardHeader className="border-b border-border/40 pb-4 bg-muted/10 flex flex-row items-center justify-between space-y-0 gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground">Aktivitas Penukaran Reward</CardTitle>
                            <CardDescription className="text-[10px] uppercase tracking-tighter">Log penukaran poin terbaru oleh member di outlet ini.</CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 font-bold text-[10px] uppercase tracking-wider border-border/60 hover:bg-muted/50 transition-all shadow-none px-3"
                            onClick={handleExportRedemptions}
                            disabled={isExporting || recentRedemptions.length === 0}
                        >
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            {isExporting ? "Mengunduh..." : "Ekspor"}
                        </Button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {recentRedemptions.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                                <Gift className="h-10 w-10 text-muted-foreground/25" />
                                <p className="text-xs font-semibold text-muted-foreground/45 uppercase tracking-wider">Belum ada penukaran reward</p>
                            </div>
                        ) : (
                            recentRedemptions.map((redemption) => {
                                const isUsed = redemption.status === "USED";
                                const isPending = redemption.status === "PENDING";
                                
                                return (
                                    <div key={redemption.id} className="flex items-start justify-between p-3 rounded-lg border border-border/40 bg-muted/10 hover:bg-muted/20 transition-all gap-4">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="p-2 rounded bg-muted border border-border/40 shrink-0">
                                                <Award className="h-4 w-4 text-emerald-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-foreground truncate">{redemption.rewardName}</p>
                                                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                                    Oleh: <span className="font-bold">{redemption.customerName}</span> ({redemption.customerPhone})
                                                </p>
                                                <p className="text-[9px] text-muted-foreground/60 flex items-center gap-1 mt-1 font-semibold">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {format(new Date(redemption.createdAt), "d MMM yyyy HH:mm", { locale: localeId })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                                            <span className="text-xs font-black text-rose-500 tabular-nums">-{redemption.pointsUsed} Poin</span>
                                            <Badge
                                                variant="outline"
                                                className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0 border-0 ${
                                                    isUsed ? "bg-emerald-500/10 text-emerald-500" :
                                                    isPending ? "bg-amber-500/10 text-amber-500" :
                                                    "bg-muted-foreground/10 text-muted-foreground"
                                                }`}
                                            >
                                                {redemption.status}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
