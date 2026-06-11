"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useOutletStore } from "@/stores/outlet.store";
import { toast } from "sonner";
import { Outlet } from "@/types";
import { cn } from "@/lib/utils";

import {
  Building2,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  MapPin,
  Phone,
  Check,
  Store,
  Link2,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";
import { copyToClipboard } from "@/lib/url";
import { useRouter } from "next/navigation";

interface OutletsSectionProps {
  outlets: Outlet[];
  selectedOutlet?: string;
  onAddOutlet: () => void;
  onEditOutlet?: (outlet: Outlet) => void;
  onDeleteOutlet?: (outlet: Outlet) => void;
  onToggleOutletActive?: (
    outlet: Outlet,
    isActive: boolean,
  ) => Promise<void> | void;
  isLoading?: boolean;
}

export default function OutletsSection({
  outlets,
  selectedOutlet,
  onAddOutlet,
  onEditOutlet,
  onDeleteOutlet,
  onToggleOutletActive,
  isLoading = false,
}: OutletsSectionProps) {
  const { setSelectedOutlet } = useOutletStore();
  const [togglingOutletId, setTogglingOutletId] = useState<string | null>(null);
  const router = useRouter();

  const handleSelectOutlet = (outlet: Outlet) => {
    if (outlet.id === selectedOutlet) return;
    setSelectedOutlet(outlet);
    toast.success("Outlet terpilih", {
      description: `Beralih ke ${outlet.name}`,
      duration: 2000,
    });
  };

  const handleCopy = async (outletSlug: string) => {
    try {
      await copyToClipboard(
        `${process.env.NEXT_PUBLIC_CUSTOMER_URL}/outlet/${outletSlug}`,
      );
      toast.success("Link outlet berhasil disalin");
    } catch {
      toast.error("Gagal menyalin link");
    }
  };

  const handleToOutletDashboard = (
    outlet: Outlet,
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/owner/outlets`);
    setSelectedOutlet(outlet);
  };

  const handleToggleOutletActive = async (outlet: Outlet, checked: boolean) => {
    if (!onToggleOutletActive) return;
    try {
      setTogglingOutletId(outlet.id);
      await onToggleOutletActive(outlet, checked);
    } finally {
      setTogglingOutletId(null);
    }
  };

  if (!outlets || outlets.length === 0) {
    return (
      <Card className="rounded-md gap-0 py-0 border-dashed flex flex-col items-center justify-center p-12 bg-muted/5 text-center">
        <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
          <Store className="h-10 w-10" />
        </div>
        <CardTitle className="text-xl font-bold">Belum Ada Outlet</CardTitle>
        <CardDescription className="max-w-xs mt-2">
          Tambahkan outlet pertama Anda untuk mulai mengelola bisnis dan
          menerima pesanan.
        </CardDescription>
        <Button onClick={onAddOutlet} className="mt-6">
          <Plus className="h-4 w-4" /> Tambah Outlet Pertama
        </Button>
      </Card>
    );
  }

  return (
    <Card className="rounded-md gap-0 py-0 overflow-hidden border-border/60 shadow-md bg-linear-to-b from-background to-muted/5">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-muted/20 p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
            <Store className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight">
              Manajemen Outlet
            </CardTitle>
            <CardDescription className="text-xs font-medium">
              {outlets.length} outlet terdaftar dalam ekosistem bisnis Anda.
            </CardDescription>
          </div>
        </div>
        <Button onClick={onAddOutlet} disabled={isLoading} size="sm">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Tambah Outlet
        </Button>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {outlets.map((outlet, index) => {
            const isSelected = outlet.id === selectedOutlet;
            const isOutletActive = outlet.isOpen !== false;

            return (
              <div
                key={outlet.id}
                onClick={() => handleSelectOutlet(outlet)}
                className={cn(
                  "group relative flex flex-col p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/5 scale-[1.02]"
                    : "border-border bg-background hover:border-primary/40 hover:shadow-md",
                )}
              >
                {/* Selection Pulse */}
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-tighter">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      Selected
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4 mb-4">
                  <div className="relative shrink-0">
                    {outlet.image ? (
                      <img
                        src={outlet.image}
                        alt={outlet.name}
                        className="h-14 w-14 rounded-xl object-cover shadow-sm border border-border/50"
                      />
                    ) : (
                      <div
                        className={cn(
                          "h-14 w-14 rounded-xl flex items-center justify-center shadow-sm border border-border/50",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Building2 className="h-7 w-7" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className={cn(
                        "text-base font-bold truncate pr-16",
                        isSelected ? "text-primary" : "text-foreground",
                      )}
                    >
                      {outlet.name}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-1 truncate">
                      <MapPin className="h-3 w-3" /> {outlet.address}
                    </p>
                  </div>
                </div>

                <div className="mt-auto space-y-4">
                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isOutletActive}
                        onCheckedChange={(checked) =>
                          handleToggleOutletActive(outlet, checked)
                        }
                        disabled={togglingOutletId === outlet.id}
                        onClick={(e) => e.stopPropagation()}
                        className="scale-75 origin-left"
                      />
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          isOutletActive
                            ? "text-emerald-600"
                            : "text-muted-foreground",
                        )}
                      >
                        {isOutletActive ? "AKTIF" : "NONAKTIF"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditOutlet?.(outlet);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(outlet.slug!);
                        }}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteOutlet?.(outlet);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "flex items-center justify-between text-[10px] font-bold py-2 px-3 rounded-lg border transition-colors",
                      isSelected
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-muted/50 border-border/50 text-muted-foreground",
                    )}
                    onClick={(e) => handleToOutletDashboard(outlet, e)}
                  >
                    <span className="flex items-center gap-1.5 uppercase tracking-widest">
                      <LayoutDashboard className="h-3 w-3" /> Dashboard
                    </span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
