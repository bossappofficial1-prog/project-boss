"use client";

import { Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatLimitLabel,
  getDaysRemaining,
  parsePlanFeatures,
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_STYLES,
} from "./helper";
import { cn, formatCurrency, formatISOStringDate } from "@/lib/utils";
import {
  ArrowRight,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  Package2,
  ReceiptText,
  ShieldCheck,
  Users,
  Zap,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OwnerSubscriptionOverviewResponse } from "@/lib/apis/owner-subscription";
import { useMemo } from "react";
import { formatDateTime } from "@/features/orders/components/owner/utils";

type Props = {
  data: OwnerSubscriptionOverviewResponse;
  handleRenew: () => void;
  isRenewLoading: boolean;
  onSwitchBillingCycle?: (newCycle: number) => void;
  isSwitchingBillingCycle?: boolean;
};

export function SubscriptionDetailSection({
  data,
  handleRenew,
  isRenewLoading,
}: Props) {
  const overview = data;
  const plan = overview?.plan ?? null;
  const usage = overview?.usage;
  const planFeatures = useMemo(
    () => parsePlanFeatures(plan?.features),
    [plan?.features],
  );
  const endsAt =
    overview?.business?.subscriptionEndDate ??
    usage?.subscription?.endsAt ??
    null;
  const daysLeft = getDaysRemaining(endsAt);

  return (
    <section className="grid gap-4 lg:grid-cols-12">
      {/* Main Plan Card */}
      <Card className="lg:col-span-8 gap-0 py-0 rounded-md overflow-hidden border-border/80 bg-background shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between border-b border-border/40 bg-muted/30 p-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                {plan?.name ?? "Paket Kustom"}
              </h2>
              {overview.business?.subscriptionStatus && (
                <Badge
                  className={cn(
                    "px-2.5 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-widest shadow-none",
                    SUBSCRIPTION_STATUS_STYLES[
                      overview.business.subscriptionStatus
                    ],
                  )}
                >
                  {
                    SUBSCRIPTION_STATUS_LABELS[
                      overview.business.subscriptionStatus
                    ]
                  }
                </Badge>
              )}
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
              ID Paket: {plan?.code || "N/A"} • {plan?.durationDays ?? "-"} Hari
              Aktif
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Biaya Paket
            </p>
            <p className="text-3xl font-black tracking-tighter text-foreground">
              {plan ? formatCurrency(plan.price) : "-"}
            </p>
            {plan?.yearlyPrice && plan.yearlyPrice > 0 && (
              <p className="text-xs font-medium text-muted-foreground mt-1">
                Yearly:{" "}
                {formatCurrency(
                  plan.yearlyPrice * (1 - plan.yearlyDiscount / 100),
                )}
                {plan.yearlyDiscount > 0 && (
                  <span className="ml-1 text-emerald-600">
                    (-{plan.yearlyDiscount}%)
                  </span>
                )}
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-md border border-border/60 bg-muted/20 p-4 space-y-2 group hover:border-border/80 transition-colors">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" /> Aktif Sejak
              </p>
              <p className="text-sm font-bold text-foreground">
                {formatISOStringDate(
                  overview.business?.subscriptionStartDate ?? "-",
                )}
              </p>
            </div>
            <div className="rounded-md border border-border/60 bg-muted/20 p-4 space-y-2 group hover:border-border/80 transition-colors">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Clock3 className="h-3 w-3" /> Berakhir Pada
              </p>
              <p className="text-sm font-bold text-foreground">
                {endsAt ? formatISOStringDate(endsAt) : "-"}
              </p>
            </div>
            <div
              className={cn(
                "rounded-md border p-4 flex items-center justify-between shadow-none transition-all",
                daysLeft !== null && daysLeft <= 7
                  ? "bg-rose-500/10 border-rose-200 text-rose-700 dark:text-rose-400"
                  : "bg-emerald-500/10 border-emerald-200 text-emerald-700 dark:text-emerald-400",
              )}
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                  Sisa Masa Aktif
                </p>
                <p className="text-sm font-black italic">
                  {daysLeft === null
                    ? "-"
                    : daysLeft === 0
                      ? "HARI INI"
                      : `${daysLeft} HARI`}
                </p>
              </div>
              <ShieldCheck className="h-8 w-8 opacity-20" />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-md border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-background border border-border/80 flex items-center justify-center text-muted-foreground">
                <CreditCard className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                {overview.business?.name}
              </span>
            </div>
            <div className="text-[10px] font-medium text-muted-foreground italic">
              Status sinkronisasi terakhir:{" "}
              {formatDateTime(overview.business?.subscriptionStartDate ?? "")}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Card */}
      <Card className="lg:col-span-4 gap-0 pb-0 rounded-md overflow-hidden border-border/80 bg-background shadow-sm">
        <CardHeader className="border-b border-border/40 bg-muted/30">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground">
            Fitur Paket Aktif
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {planFeatures ? (
            <ul className="space-y-4">
              {[
                {
                  icon: Store,
                  label: "Maksimal Outlet",
                  value: formatLimitLabel(planFeatures.maxOutlets),
                },
                {
                  icon: Package2,
                  label: "Produk & Layanan",
                  value: formatLimitLabel(planFeatures.maxProducts),
                },
                {
                  icon: Users,
                  label: "Tim Staf",
                  value: formatLimitLabel(planFeatures.maxStaff),
                },
                {
                  icon: FileText,
                  label: "Ekspor Laporan",
                  value: planFeatures.canExportReport
                    ? "Tersedia"
                    : "Tidak Tersedia",
                },
                {
                  icon: ReceiptText,
                  label: "Support Level",
                  value:
                    planFeatures.supportLevel === "PRIORITY"
                      ? "Priority Direct"
                      : planFeatures.supportLevel === "WHATSAPP"
                        ? "WA Bisnis"
                        : "Email",
                },
              ].map((feat, idx) => (
                <li key={idx} className="flex items-center gap-3 group">
                  <div className="p-1.5 rounded-md bg-muted text-muted-foreground group-hover:bg-primary/20 transition-colors border border-border/80">
                    <feat.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 border-b border-border/40 pb-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                      {feat.label}
                    </span>
                    <span className="text-xs font-black text-foreground">
                      {feat.value}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-10 text-center space-y-2">
              <ShieldCheck className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-xs text-muted-foreground font-medium italic">
                Fitur paket tidak terbaca.
              </p>
            </div>
          )}

          <Button
            variant="default"
            className="w-full mt-6 "
            onClick={handleRenew}
            disabled={!plan || isRenewLoading}
          >
            {isRenewLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Perpanjang Paket Ini
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
