import React from 'react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { POSCustomerMode } from '@/types/pos';

export interface CustomerFormCardProps {
    mode: POSCustomerMode;
    onModeChange: (mode: POSCustomerMode) => void;
    customerName: string;
    onCustomerNameChange: (value: string) => void;
    customerPhone: string;
    onCustomerPhoneChange: (value: string) => void;
}

export function CustomerFormCard({
    mode,
    onModeChange,
    customerName,
    onCustomerNameChange,
    customerPhone,
    onCustomerPhoneChange,
}: CustomerFormCardProps) {
    const isWalkIn = mode === 'walkin';

    return (
        <Card className="border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/60">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Data Pelanggan</CardTitle>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Label htmlFor="pos-walkin-toggle" className="cursor-pointer">
                            Lewati data
                        </Label>
                        <Switch
                            id="pos-walkin-toggle"
                            checked={isWalkIn}
                            onCheckedChange={(checked) => onModeChange(checked ? 'walkin' : 'identified')}
                        />
                    </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Isi data pelanggan untuk membership atau biarkan kosong jika transaksi cepat.
                </p>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-1">
                    <Label htmlFor="customer-name">Nama</Label>
                    <Input
                        id="customer-name"
                        placeholder="Nama pelanggan"
                        value={isWalkIn ? 'Walk-in Customer' : customerName}
                        disabled={isWalkIn}
                        onChange={(event) => onCustomerNameChange(event.target.value)}
                        className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-900 dark:disabled:text-slate-400"
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="customer-phone">No. HP</Label>
                    <Input
                        id="customer-phone"
                        placeholder="08xxxxxxxxxx"
                        value={isWalkIn ? '' : customerPhone}
                        disabled={isWalkIn}
                        onChange={(event) => onCustomerPhoneChange(event.target.value)}
                        className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-900 dark:disabled:text-slate-400"
                    />
                </div>
            </CardContent>
        </Card>
    );
}

export default CustomerFormCard;
