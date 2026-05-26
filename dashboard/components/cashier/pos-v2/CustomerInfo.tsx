"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { useLoyaltyMembers, useRegisterLoyaltyMember } from "@/hooks/api/use-loyalty";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
}

import { useQuery } from "@tanstack/react-query";
import { useGetTables } from "@/hooks/api/use-tables";
import { LayoutGrid } from "lucide-react";
import { TableSelector } from "./TableSelector";
import { cn } from "@/lib/utils";
import { useOutletContext } from "@/components/providers/CashierOutletProvider";

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
}: CustomerInfoProps) {
    const { selectedOutlet } = useOutletContext();
    const hasProAccess = ["TRIAL", "PRO", "ENTERPRISE"].includes(
        (selectedOutlet as any)?.business?.subscriptionPlan?.toUpperCase() || "BASIC"
    );
    const registerMember = useRegisterLoyaltyMember();
    const isTableFeatureEnabled =
        (outletType === "FNB" || outletType === "CUSTOM") && hasProAccess;

    const [isTableSelectorOpen, setIsTableSelectorOpen] = React.useState(false);

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

    React.useEffect(() => {
        onMemberChange?.(member);
    }, [member, onMemberChange]);

    const handleRegister = () => {
        if (!name || !phone) {
            toast.error("Nama dan nomor telepon harus diisi");
            return;
        }
        registerMember.mutate(
            { outletId, name, phone },
            {
                onSuccess: () => {
                    toast.success("Berhasil mendaftarkan member baru!");
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || "Gagal mendaftarkan member");
                },
            },
        );
    };

    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-bold">Pelanggan</Label>
                <div className="flex items-center gap-3">
                    {isTableFeatureEnabled && (
                        <div className="flex items-center gap-2">
                            <Label htmlFor="table" className="text-[10px] font-bold text-muted-foreground">Meja</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-2 px-2.5 text-xs font-bold bg-background border-border/60 hover:border-primary/40"
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
                        <span className="text-xs text-muted-foreground">Walk-in</span>
                        <Switch checked={isWalkIn} onCheckedChange={onWalkInChange} />
                    </div>
                </div>
            </div>

            {!isWalkIn && (
                <div className="space-y-2.5">
                    <div className="grid gap-2.5 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="customerName" className="text-xs text-muted-foreground">
                                Nama
                            </Label>
                            <Input
                                id="customerName"
                                value={name}
                                onChange={(e) => onNameChange(e.target.value)}
                                placeholder="Nama pelanggan"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="customerPhone" className="text-xs text-muted-foreground">
                                No. Telepon
                            </Label>
                            <Input
                                id="customerPhone"
                                value={phone}
                                onChange={(e) => onPhoneChange(e.target.value)}
                                placeholder="08xxxxxxxxxx"
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {isPhoneValid && (
                        <div className="rounded-lg border border-border bg-muted/20 p-2">
                            {isLoading ? (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Memeriksa keanggotaan...
                                </div>
                            ) : member ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                            Member Outlet
                                        </span>
                                        <span className="text-sm font-bold text-primary">
                                            {member.points.toLocaleString("id-ID")} Poin
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="bg-primary/5 text-primary">
                                        {member.tier}
                                    </Badge>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Belum menjadi member outlet ini</span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleRegister}
                                        disabled={registerMember.isPending}
                                        className="h-7 gap-1 px-2 text-primary hover:bg-primary/10">
                                        <UserPlus className="h-3 w-3" />
                                        <span className="text-xs">Jadikan Member</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {isPhoneValid && member && subtotal > loyaltyConfig.pointValue && (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                            <div className="flex items-center justify-between mb-2">
                                <Label className="text-xs font-semibold text-primary">Tukar Poin</Label>
                                <span className="text-[10px] text-primary/80">1 Poin = Rp {loyaltyConfig?.pointValue.toLocaleString("id-ID")}</span>
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
                                    className="h-8 text-sm"
                                    placeholder="Jumlah poin..."
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => {
                                        const maxPointsBySubtotal = Math.ceil(subtotal / (loyaltyConfig as any).pointValue);
                                        onPointsRedeemedChange(Math.min(member.points, maxPointsBySubtotal));
                                    }}
                                >
                                    Max
                                </Button>
                            </div>
                            {loyaltyDiscount > 0 && (
                                <p className="mt-1 text-[10px] text-primary italic">
                                    Potongan: -Rp {loyaltyDiscount.toLocaleString("id-ID")}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
