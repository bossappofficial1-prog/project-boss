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
}: CustomerInfoProps) {
    const registerMember = useRegisterLoyaltyMember();

    // Search for member if phone is valid (min 10 digits)
    const isPhoneValid = phone.length >= 10;
    const { data, isLoading } = useLoyaltyMembers(outletId, {
        search: isPhoneValid ? phone : undefined,
        limit: 1,
    });

    const member = data?.members?.[0] && data.members[0].customer.phone === phone ? data.members[0] : null;

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
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Pelanggan</Label>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Walk-in</span>
                    <Switch checked={isWalkIn} onCheckedChange={onWalkInChange} />
                </div>
            </div>

            {!isWalkIn && (
                <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="customerName" className="text-xs text-slate-600 dark:text-slate-400">
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
                            <Label htmlFor="customerPhone" className="text-xs text-slate-600 dark:text-slate-400">
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
                        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-900/30">
                            {isLoading ? (
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Memeriksa keanggotaan...
                                </div>
                            ) : member ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                            Member Outlet
                                        </span>
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                            {member.points.toLocaleString("id-ID")} Poin
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        {member.tier}
                                    </Badge>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">Belum menjadi member outlet ini</span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleRegister}
                                        disabled={registerMember.isPending}
                                        className="h-7 gap-1 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30">
                                        <UserPlus className="h-3 w-3" />
                                        <span className="text-xs">Jadikan Member</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
