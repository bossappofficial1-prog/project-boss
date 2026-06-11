"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface SubscriptionSectionProps {
  business: {
    subscriptionStatus?: string;
    subscriptionPlan?: string;
    subscriptionEndDate?: string;
  } | null;
}

const PLAN_FEATURES: Record<string, string[]> = {
  BASIC: ["1 Outlet", "50 Produk", "3 Staff", "Laporan Dasar"],
  PRO: [
    "Multi-outlet",
    "Produk Unlimited",
    "Staff Unlimited",
    "Laporan Lanjutan",
    "WhatsApp Gateway",
    "Loyalty Program",
    "Analitik AI",
  ],
  ENTERPRISE: [
    "Semua fitur PRO",
    "Dedicated Support",
    "Custom Integration",
    "SLA Garansi",
  ],
};

export function SubscriptionSection({ business }: SubscriptionSectionProps) {
  const plan = business?.subscriptionPlan?.toUpperCase() || "BASIC";
  const isActive = business?.subscriptionStatus === "ACTIVE";
  const features = PLAN_FEATURES[plan] || PLAN_FEATURES.BASIC;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Langganan
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola paket langganan dan tagihan Anda.
        </p>
      </div>

      <Card className="shadow-sm pt-0 gap-0 border-border/60 overflow-hidden">
        <div className="bg-linear-to-br from-primary/5 via-primary/10 to-transparent p-6 border-b border-border/40">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Paket Saat Ini
                </span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight">{plan}</h3>
            </div>
            <Badge
              variant={isActive ? "default" : "secondary"}
              className="text-[10px] font-bold uppercase tracking-wider"
            >
              {isActive ? "Aktif" : "Tidak Aktif"}
            </Badge>
          </div>

          {business?.subscriptionEndDate && (
            <p className="text-xs text-muted-foreground mt-3">
              Berlaku hingga{" "}
              <span className="font-semibold text-foreground">
                {new Intl.DateTimeFormat("id-ID", {
                  dateStyle: "medium",
                }).format(new Date(business.subscriptionEndDate))}
              </span>
            </p>
          )}
        </div>

        <CardContent className="pt-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Fitur Termasuk
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border/40 flex flex-col sm:flex-row gap-2">
            <Link href="/owner/subscription" className="flex-1">
              <Button
                variant="default"
                className="w-full justify-between group"
              >
                <span>Kelola Langganan</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            {plan !== "ENTERPRISE" && (
              <Link href="/owner/subscription" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full justify-between group"
                >
                  <span>Upgrade Plan</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
