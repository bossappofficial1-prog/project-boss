"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCw, CreditCard, Repeat2, ShieldCheck } from "lucide-react";

interface Props {
    onRefresh: () => void;
    onChangePlan: () => void;
    onRenew: () => void;
    isRefreshing: boolean;
    canChangePlan: boolean;
    canRenew: boolean;
    isRenewLoading: boolean;
}

export function OwnerSubscriptionHeader({
    onRefresh,
    onChangePlan,
    onRenew,
    isRefreshing,
    canChangePlan,
    canRenew,
    isRenewLoading,
}: Props) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/80 bg-background -mx-6 px-6 pt-2">
            <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-muted text-foreground flex items-center justify-center border border-border shadow-sm">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                        Billing & Langganan
                    </h1>
                </div>
                <p className="text-sm text-muted-foreground font-medium max-w-xl">
                    Kelola paket aktif, pantau penggunaan kuota operasional, dan lihat riwayat pembayaran langganan ekosistem bisnis Anda.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="h-10 px-4 font-bold text-xs uppercase tracking-wider rounded-md border-border/60 hover:bg-muted/50 transition-all shadow-none"
                >
                    <RefreshCw className={cn("mr-2 h-3.5 w-3.5", { "animate-spin": isRefreshing })} />
                    Refresh
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onChangePlan}
                    disabled={!canChangePlan}
                    className="h-10 px-4 font-bold text-xs uppercase tracking-wider rounded-md border-border/60 hover:bg-muted/50 transition-all shadow-none"
                >
                    <CreditCard className="mr-2 h-3.5 w-3.5" />
                    Ganti Paket
                </Button>
                <Button
                    size="sm"
                    onClick={onRenew}
                    disabled={!canRenew}
                    className="h-10 px-6 font-bold text-xs uppercase tracking-wider rounded-md shadow-sm transition-all"
                >
                    {isRenewLoading ? <Repeat2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Repeat2 className="mr-2 h-3.5 w-3.5" />}
                    Perpanjang Paket
                </Button>
            </div>
        </div>
    );
}