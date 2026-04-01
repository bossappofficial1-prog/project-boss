import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
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
        <SectionHeader
            title="Status Langganan Bisnis"
            description="Pantau masa aktif paket, pemakaian kuota, dan riwayat pembayaran langganan"
            actions={<>
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
            </>}
        />
    );
}