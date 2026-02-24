import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RefreshCw, CreditCard, Repeat2 } from "lucide-react";

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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Langganan</p>
                <h1 className="text-3xl font-semibold text-foreground dark:text-gray-100">Status Langganan Bisnis</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Pantau masa aktif paket, pemakaian kuota, dan riwayat pembayaran langganan secara real-time.
                </p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={isRefreshing}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", { "animate-spin": isRefreshing })} />
                    Segarkan Data
                </Button>
                <Button variant="secondary" size="sm" onClick={onChangePlan} disabled={!canChangePlan}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Ganti Paket
                </Button>
                <Button size="sm" onClick={onRenew} disabled={!canRenew}>
                    {isRenewLoading ? <Repeat2 className="mr-2 h-4 w-4 animate-spin" /> : <Repeat2 className="mr-2 h-4 w-4" />}
                    Perpanjang Langganan
                </Button>
            </div>
        </div>
    );
}
