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
import { Building2, CreditCard, ArrowRight } from "lucide-react";
import Link from "next/link";

interface BusinessSectionProps {
  business: {
    name?: string;
    description?: string;
    subscriptionStatus?: string;
    subscriptionPlan?: string;
    subscriptionEndDate?: string;
    bankName?: string;
    bankAccount?: string;
    accountHolder?: string;
  } | null;
}

export function BusinessSection({ business }: BusinessSectionProps) {
  const hasSubscription = business?.subscriptionStatus === "ACTIVE";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Informasi Bisnis
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Detail organisasi yang terhubung dengan akun Anda.
        </p>
      </div>

      <Card className="shadow-sm gap-0 border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">
                {business?.name || "Belum ada bisnis"}
              </CardTitle>
              <CardDescription className="mt-1">
                {business?.description || "Deskripsi belum diatur"}
              </CardDescription>
            </div>
            <Badge
              variant={hasSubscription ? "default" : "secondary"}
              className="shrink-0 text-[10px] font-bold uppercase tracking-wider"
            >
              {business?.subscriptionStatus || "TIDAK AKTIF"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">
                Paket Langganan
              </p>
              <p className="text-sm font-semibold">
                {business?.subscriptionPlan || "Basic"}
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">
                Berlaku Hingga
              </p>
              <p className="text-sm font-semibold">
                {business?.subscriptionEndDate
                  ? new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                    }).format(new Date(business.subscriptionEndDate))
                  : "-"}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-border/40">
            <Link href="/owner/subscription">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between group"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span>Kelola Langganan</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {(business?.bankName || business?.bankAccount) && (
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              Rekening Bank
            </CardTitle>
            <CardDescription>
              Rekening untuk menerima pembayaran.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">
                  Bank
                </p>
                <p className="text-sm font-semibold">
                  {business.bankName || "-"}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">
                  Nomor Rekening
                </p>
                <p className="text-sm font-semibold font-mono">
                  {business.bankAccount || "-"}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">
                  Atas Nama
                </p>
                <p className="text-sm font-semibold">
                  {business.accountHolder || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
