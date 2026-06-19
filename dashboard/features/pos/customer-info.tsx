"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { useLoyaltyMembers, useRegisterLoyaltyMember, useLoyaltyRewards } from "@/hooks/api/use-loyalty";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Trophy, Calendar, Gift, Sparkles, Star, Tag, Percent, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gooeyToast } from "goey-toast";
import { useQuery } from "@tanstack/react-query";
import { useGetTables } from "@/hooks/api/use-tables";
import { LayoutGrid } from "lucide-react";
import { TableSelector } from "./table-selector";
import { cn } from "@/lib/utils";
import { useOutletStore } from "@/stores/outlet.store";

interface CustomerInfoProps {
    outletId: string;
    isWalkIn: boolean;
    onWalkInChange: (value: boolean) => void;
    name: string;
    onNameChange: (value: string) => void;
    phone: string;
    onPhoneChange: (value: string) => void;
    onMemberChange?: (member: any) => void;
    pointsRedeemed: number;
    onPointsRedeemedChange: (value: number) => void;
    loyaltyDiscount: number;
    loyaltyConfig: any;
    subtotal: number;
    outletType?: string;
    tableId?: string;
    onTableIdChange?: (value: string) => void;
    tableNumber?: string;
    onTableNumberChange?: (value: string) => void;
    loyaltyRewardId?: string;
    onLoyaltyRewardIdChange?: (value: string | undefined) => void;
}

export function CustomerInfo({
    outletId,
    isWalkIn,
    onWalkInChange,
    name,
    onNameChange,
    phone,
    onPhoneChange,
    onMemberChange,
    pointsRedeemed,
    onPointsRedeemedChange,
    loyaltyDiscount,
    loyaltyConfig,
    subtotal,
    outletType,
    tableId,
    onTableIdChange,
    tableNumber,
    onTableNumberChange,
    loyaltyRewardId,
    onLoyaltyRewardIdChange,
}: CustomerInfoProps) {
    const { selectedOutlet } = useOutletStore();
    const hasProAccess = ["TRIAL", "PRO", "ENTERPRISE"].includes(
        (selectedOutlet as any)?.business?.subscriptionPlan?.toUpperCase() || "BASIC"
    );
    const registerMember = useRegisterLoyaltyMember();
    const isTableFeatureEnabled =
        (outletType === "FNB" || outletType === "CUSTOM") && hasProAccess;

    const [isTableSelectorOpen, setIsTableSelectorOpen] = React.useState(false);
    const [redeemMode, setRedeemMode] = React.useState<"direct" | "catalog">("catalog");

    // Fetch tables for F&B
    const { data: tables = [], isLoading: isTablesLoading } = useGetTables(
        outletId,
        isTableFeatureEnabled
    );

    // Search for member if phone is valid (min 10 digits)
    const isPhoneValid = phone.length >= 10;
    const { data, isLoading } = useLoyaltyMembers(outletId, {
        search: isPhoneValid ? phone : undefined,
        limit: 1,
    });

    const member = data?.members?.[0] || null;

    // Fetch active loyalty rewards from catalog
    const { data: rewards = [], isLoading: isRewardsLoading } = useLoyaltyRewards(outletId, false);

    // Filter rewards customer can afford
    const affordableRewards = React.useMemo(() => {
        if (!member) return [];
        return rewards.filter((r) => r.isActive && member.points >= r.pointsCost);
    }, [rewards, member]);

    React.useEffect(() => {
        onMemberChange?.(member);
    }, [member, onMemberChange]);

    const handleRegister = () => {
        if (!name || !phone) {
            gooeyToast.error("Nama dan nomor telepon harus diisi");
            return;
        }
        registerMember.mutate(
            { outletId, name, phone },
            {
                onSuccess: () => {
                    gooeyToast.success("Berhasil mendaftarkan member baru!");
                },
                onError: (err: any) => {
                    gooeyToast.error(err?.response?.data?.message || "Gagal mendaftarkan member");
                },
            },
        );
    };

    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pelanggan</Label>
                <div className="flex items-center gap-3">
                    {isTableFeatureEnabled && (
                        <div className="flex items-center gap-2">
                            <Label htmlFor="table" className="text-[10px] font-bold text-muted-foreground">Meja</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-2 px-2.5 text-xs font-bold bg-background border-border/60 hover:border-primary/40 rounded-md"
                                onClick={() => setIsTableSelectorOpen(true)}
                            >
                                <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
                                {tableNumber ? `Meja ${tableNumber}` : "Pilih..."}
                            </Button>

                            <TableSelector
                                open={isTableSelectorOpen}
                                onOpenChange={setIsTableSelectorOpen}
                                tables={tables}
                                selectedTableId={tableId}
                                onSelect={(t) => {
                                    onTableIdChange?.(t.id);
                                    onTableNumberChange?.(t.name);
                                }}
                                isLoading={isTablesLoading}
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Walk-in</span>
                        <Switch checked={isWalkIn} onCheckedChange={onWalkInChange} />
                    </div>
                </div>
            </div>

            {!isWalkIn && (
                <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="customerName" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                                Nama Lengkap
                            </Label>
                            <Input
                                id="customerName"
                                value={name}
                                onChange={(e) => onNameChange(e.target.value)}
                                placeholder="Nama pelanggan"
                                className="mt-1 h-9 text-sm"
                            />
                        </div>
                        <div>
                            <Label htmlFor="customerPhone" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                                No. Telepon
                            </Label>
                            <Input
                                id="customerPhone"
                                value={phone}
                                onChange={(e) => onPhoneChange(e.target.value)}
                                placeholder="08xxxxxxxxxx"
                                className="mt-1 h-9 text-sm font-mono"
                            />
                        </div>
                    </div>

                    {isPhoneValid && (
                        <div className="rounded-md border border-border bg-muted/10 p-3 shadow-none">
                            {isLoading ? (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                    Memeriksa database keanggotaan...
                                </div>
                            ) : member ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                            <Trophy className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Saldo Poin Member
                                            </span>
                                            <span className="text-sm font-extrabold text-primary tabular-nums">
                                                {member.points.toLocaleString("id-ID")} Poin
                                            </span>
                                        </div>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 shadow-none border-border/80"
                                        style={member.tier ? { borderColor: member.tier.color + "50", backgroundColor: member.tier.color + "15", color: member.tier.color } : {}}
                                    >
                                        {member.tier?.name || "Bronze"}
                                    </Badge>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground font-medium">Bukan merupakan member outlet</span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleRegister}
                                        disabled={registerMember.isPending}
                                        className="h-7 gap-1 px-2.5 text-[10px] font-bold uppercase tracking-wider text-primary border-primary/20 hover:bg-primary/5 hover:border-primary/40 rounded-md transition-all">
                                        <UserPlus className="h-3 w-3" />
                                        Jadikan Member
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {isPhoneValid && member && loyaltyConfig?.isActive && (
                        <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-3">
                            {/* Toggle Redeem Mode */}
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-primary flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Tukar Poin Pelanggan
                                </Label>
                                <div className="inline-flex rounded-md border border-primary/20 bg-background p-0.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRedeemMode("catalog");
                                            onPointsRedeemedChange(0);
                                        }}
                                        className={cn(
                                            "rounded-sm px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-all",
                                            redeemMode === "catalog"
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Katalog
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRedeemMode("direct");
                                            onLoyaltyRewardIdChange?.(undefined);
                                        }}
                                        className={cn(
                                            "rounded-sm px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-all",
                                            redeemMode === "direct"
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        Langsung
                                    </button>
                                </div>
                            </div>

                            {/* Mode A: Catalog Reward (Option B) */}
                            {redeemMode === "catalog" && (
                                <div className="space-y-2">
                                    {isRewardsLoading ? (
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                            Memuat katalog reward...
                                        </div>
                                    ) : affordableRewards.length === 0 ? (
                                        <p className="text-[10px] text-muted-foreground italic font-medium leading-relaxed">
                                            Poin pelanggan tidak mencukupi untuk menukar reward katalog apa pun saat ini (butuh min. 50 poin).
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            <select
                                                id="reward-select"
                                                value={loyaltyRewardId || ""}
                                                onChange={(e) => {
                                                    const rId = e.target.value;
                                                    if (!rId) {
                                                        onLoyaltyRewardIdChange?.(undefined);
                                                        onPointsRedeemedChange(0);
                                                        return;
                                                    }
                                                    const reward = affordableRewards.find((r) => r.id === rId);
                                                    onLoyaltyRewardIdChange?.(rId);
                                                    if (reward) {
                                                        onPointsRedeemedChange(reward.pointsCost);
                                                    }
                                                }}
                                                className="w-full h-8 px-2 py-1 text-xs font-medium border border-primary/20 bg-background text-foreground rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-1"
                                            >
                                                <option value="">-- Pilih Reward Katalog --</option>
                                                {affordableRewards.map((reward) => {
                                                    let valText = "";
                                                    if (reward.type === "DISCOUNT_FLAT") valText = `Potongan Rp ${reward.discountAmount?.toLocaleString("id-ID")}`;
                                                    else if (reward.type === "DISCOUNT_PERCENT") valText = `Diskon ${reward.discountPercent}%${reward.maxDiscount ? ` (Maks Rp ${reward.maxDiscount.toLocaleString("id-ID")})` : ""}`;
                                                    else if (reward.type === "FREE_ITEM") valText = "Free Item";
                                                    else if (reward.type === "VOUCHER") valText = `Voucher Rp ${reward.voucherValue?.toLocaleString("id-ID")}`;
                                                    else if (reward.type === "CASHBACK") valText = `Cashback Rp ${reward.cashbackAmount?.toLocaleString("id-ID")}`;

                                                    return (
                                                        <option key={reward.id} value={reward.id}>
                                                            🏆 [{reward.pointsCost} Poin] {reward.name} ({valText})
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Mode B: Direct point conversion (Legacy) */}
                            {redeemMode === "direct" && subtotal > loyaltyConfig.pointValue && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-primary/80">Klaim Potongan Langsung</span>
                                        <span className="text-[9px] font-extrabold text-primary tabular-nums">1 Poin = Rp {loyaltyConfig?.pointValue.toLocaleString("id-ID")}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            max={member.points}
                                            value={pointsRedeemed || ""}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                const maxPointsBySubtotal = Math.ceil(subtotal / loyaltyConfig?.pointValue);
                                                onPointsRedeemedChange(Math.min(val, member.points, maxPointsBySubtotal));
                                            }}
                                            className="h-8 text-xs font-bold tabular-nums"
                                            placeholder="Jumlah poin..."
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 text-[10px] font-bold uppercase tracking-wider rounded-md border-primary/20 bg-background text-primary hover:bg-primary/5 hover:border-primary/40 px-2.5"
                                            onClick={() => {
                                                const maxPointsBySubtotal = Math.ceil(subtotal / (loyaltyConfig as any).pointValue);
                                                onPointsRedeemedChange(Math.min(member.points, maxPointsBySubtotal));
                                            }}
                                        >
                                            Max
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Applied Reward Discount Info */}
                            {loyaltyDiscount > 0 && (
                                <div className="flex items-center gap-1.5 pt-1.5 border-t border-primary/10 text-[10px] font-extrabold text-primary uppercase tracking-wide">
                                    <Tag className="h-3 w-3" />
                                    <span>Potongan Belanja: -Rp {loyaltyDiscount.toLocaleString("id-ID")}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
