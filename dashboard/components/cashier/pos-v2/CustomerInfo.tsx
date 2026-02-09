"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface CustomerInfoProps {
    isWalkIn: boolean;
    onWalkInChange: (value: boolean) => void;
    name: string;
    onNameChange: (value: string) => void;
    phone: string;
    onPhoneChange: (value: string) => void;
}

export function CustomerInfo({
    isWalkIn,
    onWalkInChange,
    name,
    onNameChange,
    phone,
    onPhoneChange,
}: CustomerInfoProps) {
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
            )}
        </div>
    );
}
