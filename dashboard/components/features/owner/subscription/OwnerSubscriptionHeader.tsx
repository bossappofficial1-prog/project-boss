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
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Langganan</p>
                <h1 className="text-2xl sm:text-3xl font-semibold text-foreground dark:text-gray-100 mt-1">Status Langganan Bisnis</h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                    Pantau masa aktif paket, pemakaian kuota, dan riwayat pembayaran langganan secara real-time.
                </p>
            </div>
            {/* Mengubah layout flex untuk responsivitas mobile */}
            <div className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-0 w-full md:w-auto shrink-0">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="w-full sm:w-auto"
                >
                    <RefreshCw className={cn("mr-2 h-4 w-4", { "animate-spin": isRefreshing })} />
                    Segarkan Data
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onChangePlan}
                    disabled={!canChangePlan}
                    className="w-full sm:w-auto"
                >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Ganti Paket
                </Button>
                <Button
                    size="sm"
                    onClick={onRenew}
                    disabled={!canRenew}
                    className="w-full sm:w-auto"
                >
                    {isRenewLoading ? <Repeat2 className="mr-2 h-4 w-4 animate-spin" /> : <Repeat2 className="mr-2 h-4 w-4" />}
                    Perpanjang
                </Button>
            </div>
        </div>
    );
}