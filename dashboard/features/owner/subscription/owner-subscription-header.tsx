"use client";

import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
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
    <SectionHeader
      title="Billing & Langganan"
      icon={ShieldCheck}
      description="Kelola paket aktif, pantau penggunaan kuota operasional, dan lihat riwayat pembayaran langganan ekosistem bisnis Anda."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("mr-2 h-3.5 w-3.5", {
                "animate-spin": isRefreshing,
              })}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onChangePlan}
            disabled={!canChangePlan}
          >
            <CreditCard className="mr-2 h-3.5 w-3.5" />
            Ganti Paket
          </Button>
          <Button size="sm" onClick={onRenew} disabled={!canRenew}>
            {isRenewLoading ? (
              <Repeat2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Repeat2 className="mr-2 h-3.5 w-3.5" />
            )}
            Perpanjang Paket
          </Button>
        </div>
      }
    />
  );
}
