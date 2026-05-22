"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { Business } from "@/types/dashboard";
import {
  Building2,
  CreditCard,
  Edit3,
  Phone,
  MapPin,
  Globe,
  ShieldCheck,
} from "lucide-react";

interface BusinessProfileCardProps {
  business: Business | null;
  onEditBusiness: () => void;
  onEditBank: () => void;
}

export default function BusinessProfileCard({
  business,
  onEditBusiness,
  onEditBank,
}: BusinessProfileCardProps) {
  if (!business) return null;

  return (
    <Card className="rounded-md gap-0 py-0 overflow-hidden border-border/60 shadow-md bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-muted/30 p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight">
              Profil Bisnis
            </CardTitle>
            <CardDescription className="text-xs flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Identitas resmi perusahaan Anda
            </CardDescription>
          </div>
        </div>
        <Button
          onClick={onEditBusiness}
          variant="outline"
          size="sm"
          className="h-9 gap-2 font-bold text-xs uppercase tracking-wider rounded-md border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Edit Profil
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border/40">
          {/* Main Info Section */}
          <div className="lg:col-span-7 p-6 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Building2 className="h-3 w-3" /> Nama Bisnis
                  </p>
                  <p className="text-base font-bold text-foreground leading-none">
                    {business.name}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Globe className="h-3 w-3" /> Tipe Bisnis
                  </p>
                  <div className="flex gap-2">
                    {[...new Set(business.type?.split("::"))].map((type) => (
                      <Badge
                        className="border-primary bg-primary/10 text-primary"
                        variant={"outline"}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Deskripsi
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  {business.description || "Belum ada deskripsi bisnis."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> Alamat Utama
                  </p>
                  <p className="text-xs font-medium text-foreground leading-relaxed">
                    {business.address || "Alamat belum diatur"}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> Kontak
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {business.phone || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Info Section (The "Card" View) */}
          <div className="lg:col-span-5 p-6 bg-muted/10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Informasi Rekening
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditBank}
                className="h-6 px-2 text-[10px] font-bold hover:bg-primary/10 hover:text-primary transition-colors"
              >
                ATUR BANK
              </Button>
            </div>

            {business.bankName && business.bankAccount ? (
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] duration-300">
                <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute right-4 top-4 opacity-20">
                  <CreditCard className="h-10 w-10" />
                </div>

                <div className="relative space-y-8">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-black italic tracking-tighter opacity-80 uppercase">
                      {business.bankName}
                    </p>
                    <div className="h-8 w-10 rounded-md bg-white/20 border border-white/30 backdrop-blur-sm" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                      Nomor Rekening
                    </p>
                    <p className="text-lg font-bold tracking-widest tabular-nums">
                      {business.bankAccount}
                    </p>
                  </div>

                  <div className="flex justify-between items-end pt-2">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">
                        Pemilik Rekening
                      </p>
                      <p className="text-sm font-bold truncate max-w-[150px] uppercase">
                        {business.accountHolder || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">
                        Biaya Admin
                      </p>
                      <p className="text-[10px] font-bold uppercase">
                        {business.transactionFeeBearer === "OWNER"
                          ? "Ditanggung Anda"
                          : "Ditanggung Cust"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group"
                onClick={onEditBank}
              >
                <div className="p-3 rounded-full bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform">
                  <CreditCard className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-foreground">
                  Rekening Belum Diatur
                </p>
                <p className="text-[10px] text-muted-foreground text-center mt-1">
                  Lengkapi data bank untuk kelancaran transaksi.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 text-xs font-bold"
                >
                  Lengkapi Sekarang
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
