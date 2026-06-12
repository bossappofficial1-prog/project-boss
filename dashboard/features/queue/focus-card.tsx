"use client";

import {
  Clock,
  User,
  Timer,
  ChevronRight,
  X,
  CalendarClock,
  ImageIcon,
  ShoppingBag,
  CheckCircle2,
  PlayCircle,
  UserCheck,
  MessageSquare,
  Phone,
  CreditCard,
  LayoutGrid,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { QueueV2Entry, QueueOrderStatus } from "@/lib/apis/queue-v2";
import { cn, formatCurrency } from "@/lib/utils";

interface FocusCardProps {
  entry: QueueV2Entry;
  onPrimaryAction?: (entry: QueueV2Entry, nextStatus: QueueOrderStatus) => void;
  onCancel?: (entry: QueueV2Entry) => void;
  onDetail?: (entry: QueueV2Entry) => void;
  onViewProof?: (entry: QueueV2Entry) => void;
  isPending?: boolean;
  isKitchenView?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    icon: any;
    borderColor: string;
  }
> = {
  AWAITING_PAYMENT: {
    label: "Menunggu Bayar",
    color: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    icon: Clock,
    borderColor: "border-l-amber-500",
  },
  CONFIRMED: {
    label: "Dikonfirmasi",
    color: "text-primary bg-primary/10",
    icon: UserCheck,
    borderColor: "border-l-primary",
  },
  PROCESSING: {
    label: "Diproses",
    color: "text-primary bg-primary/10",
    icon: Timer,
    borderColor: "border-l-primary",
  },
  ON_GOING: {
    label: "Sedang Dilayani",
    color: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
    icon: PlayCircle,
    borderColor: "border-l-blue-500",
  },
  COMPLETED: {
    label: "Selesai",
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    icon: CheckCircle2,
    borderColor: "border-l-emerald-500",
  },
  CANCELLED: {
    label: "Dibatalkan",
    color: "text-destructive bg-destructive/10",
    icon: X,
    borderColor: "border-l-destructive",
  },
};

const PRIMARY_ACTIONS: Partial<
  Record<
    QueueOrderStatus,
    { nextStatus: QueueOrderStatus; label: string }
  >
> = {
  AWAITING_PAYMENT: {
    nextStatus: "CONFIRMED",
    label: "Konfirmasi",
  },
  PROCESSING: { nextStatus: "CONFIRMED", label: "Konfirmasi" },
  CONFIRMED: { nextStatus: "ON_GOING", label: "Mulai Layanan" },
  ON_GOING: { nextStatus: "COMPLETED", label: "Selesaikan" },
};

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function isFutureDate(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return target.getTime() > today.getTime();
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

export function FocusCard({
  entry,
  onPrimaryAction,
  onCancel,
  onDetail,
  onViewProof,
  isPending = false,
  isKitchenView = false,
}: FocusCardProps) {
  const config = STATUS_CONFIG[entry.orderStatus] ?? STATUS_CONFIG.PROCESSING;
  const primary = PRIMARY_ACTIONS[entry.orderStatus];
  const isTerminal =
    entry.orderStatus === "COMPLETED" || entry.orderStatus === "CANCELLED";
  const isFuture = isFutureDate(entry.scheduledStart);
  const NEEDS_TODAY_STATUSES: QueueOrderStatus[] = ["ON_GOING", "COMPLETED"];
  const blockAction =
    isFuture &&
    primary &&
    NEEDS_TODAY_STATUSES.includes(primary.nextStatus);
  const isAwaitingManualProof =
    entry.orderStatus === "AWAITING_PAYMENT" &&
    entry.isManualPayment &&
    !entry.paymentProofUrl;

  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "relative overflow-hidden gap-0 py-0 rounded-lg border-border/60 bg-card shadow-sm border-l-4",
        config.borderColor
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/40">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted border border-border/40 text-lg font-bold text-foreground tabular-nums shrink-0">
            {entry.position}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground truncate">
                {entry.customerName}
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-bold border-0 shrink-0",
                  config.color
                )}
              >
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
              <span className="text-[10px] font-mono">
                #{entry.id.slice(-8).toUpperCase()}
              </span>
              {entry.tableNumber && (
                <>
                  <span className="text-[10px] opacity-30">|</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
                    <LayoutGrid className="w-3 h-3" />
                    Meja {entry.tableNumber}
                  </span>
                </>
              )}
              {!isKitchenView && entry.customerPhone && (
                <>
                  <span className="text-[10px] opacity-30">|</span>
                  <span className="flex items-center gap-1 text-[10px]">
                    <Phone className="w-3 h-3 opacity-40" />
                    {entry.customerPhone}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {!isKitchenView && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDetail?.(entry)}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            {!isTerminal && (
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={isPending}
                onClick={() => onCancel?.(entry)}
              >
                <X className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Info Row */}
      <div className="grid grid-cols-3 divide-x divide-border/40">
        {/* Service */}
        <div className="px-4 py-3 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Layanan
          </p>
          <p className="text-sm font-semibold text-foreground truncate">
            {entry.productName}
          </p>
          {entry.goodsCount > 0 && (
            <p className="text-[10px] font-medium text-primary flex items-center gap-1">
              <ShoppingBag className="w-3 h-3" />+{entry.goodsCount} produk
            </p>
          )}
        </div>

        {/* Time */}
        <div className="px-4 py-3 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Waktu
          </p>
          <p className="text-sm font-semibold text-foreground tabular-nums">
            {entry.scheduledStart
              ? formatTime(entry.scheduledStart)
              : "Sekarang"}
          </p>
          <div className="flex items-center gap-1.5">
            <Timer className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {entry.productDuration || 0} mnt
            </span>
            {isFuture && entry.scheduledStart && (
              <Badge
                variant="outline"
                className="text-[9px] ml-auto border-amber-500/30 text-amber-600 bg-amber-500/5"
              >
                <CalendarClock className="w-2.5 h-2.5 mr-0.5" />
                {formatShortDate(entry.scheduledStart)}
              </Badge>
            )}
          </div>
        </div>

        {/* Staff */}
        <div className="px-4 py-3 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Staf
          </p>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground truncate">
                {entry.staffName || "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">Teknisi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {!isKitchenView && (
        <div className="flex items-center justify-between p-4 border-t border-border/40 bg-muted/10">
          <div>
            <p className="text-[10px] text-muted-foreground">Total</p>
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-bold text-foreground tabular-nums">
                {formatCurrency(entry.totalAmount)}
              </p>
              {entry.discountAmount > 0 && (
                <span className="text-[11px] text-muted-foreground line-through tabular-nums">
                  {formatCurrency(entry.totalAmount + entry.discountAmount)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CreditCard className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">
                {entry.paymentMethod || "Online"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isTerminal && (
              <>
                {entry.isManualPayment && entry.paymentProofUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewProof?.(entry)}
                  >
                    <ImageIcon className="w-4 h-4" />
                    Bukti
                  </Button>
                )}

                {primary && !blockAction && !isAwaitingManualProof && (
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() =>
                      onPrimaryAction?.(entry, primary.nextStatus)
                    }
                  >
                    {isPending ? (
                      <Timer className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {primary.label}
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}

                {isAwaitingManualProof && (
                  <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                    <p className="text-xs font-medium text-amber-600">
                      Menunggu Bukti
                    </p>
                  </div>
                )}

                {blockAction && !isAwaitingManualProof && (
                  <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                    <p className="text-xs font-medium text-amber-600">
                      {formatShortDate(entry.scheduledStart!)}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
