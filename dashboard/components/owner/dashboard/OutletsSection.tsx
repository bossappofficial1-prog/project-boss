"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { toast } from "sonner";
import { Outlet } from "@/types";

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
} from "lucide-react";
import { copyToClipboard } from "@/lib/url";

interface OutletsSectionProps {
  outlets: Outlet[];
  selectedOutlet?: string;
  onAddOutlet: () => void;
  onEditOutlet?: (outlet: Outlet) => void;
  onDeleteOutlet?: (outlet: Outlet) => void;
  onToggleOutletActive?: (outlet: Outlet, isActive: boolean) => Promise<void> | void;

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
  const { setSelectedOutlet } = useOutletContext();
  const [selectedForAction, setSelectedForAction] = useState<string | null>(null);
  const [togglingOutletId, setTogglingOutletId] = useState<string | null>(null);

  const handleSelectOutlet = (outlet: Outlet) => {
    if (outlet.id === selectedOutlet) {
      console.log(`🔄 OutletsSection: Outlet already selected, returning early`);
      return;
    }

    setSelectedOutlet(outlet);
    toast.success("Outlet berubah", {
      description: `Beralih ke ${outlet.name}`,
      duration: 2000,
    });
  };

  const handleCopy = async (outletSlug: string) => {
    try {
      await copyToClipboard(`${process.env.NEXT_PUBLIC_CUSTOMER_URL}/outlet/${outletSlug}`);
      toast.success('Berhasil salin link outlet')
    } catch (error) {
      toast.error('Gagal salin link outlet')
    }
  }

  const handleToggleOutletActive = async (outlet: Outlet, checked: boolean) => {
    if (!onToggleOutletActive) return;

    try {
      setTogglingOutletId(outlet.id);
      await onToggleOutletActive(outlet, checked);
      toast.success(`Outlet ${checked ? "diaktifkan" : "dinonaktifkan"}`, {
        description: outlet.name,
      });
    } catch {
      toast.error("Gagal mengubah status outlet");
    } finally {
      setTogglingOutletId(null);
    }
  };

  if (!outlets || outlets.length === 0) {
    return (
      <Card className="card-hover animate-fade-in-up rounded-md p-4">
        <div className="py-6 text-center">
          <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Building2 className="text-muted-foreground h-8 w-8" />
          </div>
          <h3 className="text-foreground mb-2 text-lg font-semibold">
            Belum ada outlet
          </h3>
          <p className="text-muted-foreground mx-auto mb-6 max-w-md">
            Tambahkan outlet pertama Anda untuk mulai menjual produk dan layanan
          </p>
          <Button
            onClick={onAddOutlet}
            type="button"
            className="shadow-md transition-shadow duration-300">
            <Plus className="mr-2 inline h-5 w-5" />
            Tambah Outlet Pertama
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-hover animate-fade-in-up rounded-md p-4">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
        <div className="flex items-center">
          <div className="bg-primary text-primary-foreground mr-3 flex h-10 w-10 items-center justify-center rounded-md">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-foreground text-xl font-bold sm:text-2xl">
              Outlet Bisnis
            </h2>
            <p className="text-muted-foreground text-sm">
              {outlets.length} outlet tersedia • Klik untuk beralih
            </p>
          </div>
        </div>

        <Button onClick={onAddOutlet} disabled={isLoading} type="button">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-1.5 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
          )}
          Tambah Outlet
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {outlets.map((outlet, index) => {
          const isSelected = outlet.id === selectedOutlet;
          const isActionSelected = selectedForAction === outlet.id;
          const isOutletActive = outlet.isOpen !== false;

          return (
            <div
              key={outlet.id}
              className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 p-4 transition-all duration-300 sm:p-5 ${isSelected
                ? "scale-[1.02] border-primary bg-primary/10 shadow-lg"
                : "border-border bg-card hover:scale-[1.01] hover:border-primary/40 hover:bg-muted/40 hover:shadow-md"
                }`}
              style={{ animationDelay: `${0.1 * index}s` }}
              onClick={() => handleSelectOutlet(outlet)}
              onMouseEnter={() => setSelectedForAction(outlet.id)}
              onMouseLeave={() => setSelectedForAction(null)}>
              {isSelected && <div className="absolute left-0 top-0 h-1 w-full bg-red-gradient" />}

              {(onEditOutlet || onDeleteOutlet) && (
                <div
                  className={`absolute right-3 bottom-3 flex space-x-1 transition-all duration-200 `}>
                  {onEditOutlet && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditOutlet(outlet);
                      }}
                      type="button"
                      variant="secondary"
                      size="icon-sm"
                      className="rounded-md shadow-sm"
                      title="Edit Outlet">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {onDeleteOutlet && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteOutlet(outlet);
                      }}
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      className="rounded-md shadow-sm"
                      title="Hapus Outlet">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(outlet.slug!)
                    }}
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="rounded-md bg-card"
                    title="Salin link outlet ini untuk dibagikan">
                    <Link2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              <div className="flex items-start space-x-4">
                <div className="shrink-0">
                  {outlet.image ? (
                    <div className="relative">
                      <img
                        src={outlet.image}
                        alt={outlet.name}
                        className="h-14 w-14 rounded-xl object-cover shadow-md"
                      />
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`relative flex h-14 w-14 items-center justify-center rounded-xl shadow-md ${isSelected
                        ? "bg-primary"
                        : "bg-muted"
                        }`}>
                      <Store className={`h-7 w-7 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      {isSelected && (
                        <div className="bg-background absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full">
                          <Check className="text-primary h-3 w-3" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <h3
                      className={`truncate text-base font-semibold ${isSelected
                        ? "text-primary"
                        : "text-foreground"
                        }`}>
                      {outlet.name}
                    </h3>
                    <div
                      className="ml-2 flex items-center gap-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {togglingOutletId === outlet.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      ) : null}
                      <Switch
                        checked={isOutletActive}
                        onCheckedChange={(checked) => handleToggleOutletActive(outlet, checked)}
                        disabled={!onToggleOutletActive || togglingOutletId === outlet.id}
                        aria-label={`Ubah status ${outlet.name}`}
                      />
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-2 line-clamp-2 text-sm">
                    <MapPin className="mr-1 inline h-3.5 w-3.5" />
                    {outlet.address}
                  </p>

                  {outlet.phone && (
                    <p className="text-muted-foreground flex items-center text-xs">
                      <Phone className="mr-1 h-3 w-3" />
                      {outlet.phone}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {isOutletActive ? (
                      isSelected ? (
                        <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                          <span className="mr-1.5 flex h-2 w-2 animate-pulse rounded-full bg-current" />
                          Outlet Aktif
                        </span>
                      ) : (
                        <span className="text-muted-foreground inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium transition-colors group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary">
                          Klik untuk pilih
                        </span>
                      )
                    ) : (
                      <span className="text-muted-foreground inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                        <span className="mr-1.5 flex h-2 w-2 rounded-full bg-muted-foreground/60" />
                        Outlet Nonaktif
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`pointer-events-none absolute inset-0 rounded-xl border-2 border-dashed transition-opacity duration-200 ${isActionSelected && !isSelected ? "border-primary opacity-20" : "opacity-0"
                  }`}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
