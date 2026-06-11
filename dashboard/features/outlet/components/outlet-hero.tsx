"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Store,
  MapPin,
  Phone,
  Globe,
  Clock,
  Pencil,
  QrCode,
  Zap,
  ArrowRightLeft,
} from "lucide-react";

interface OutletHeroProps {
  outlet: {
    id: string;
    name: string;
    image?: string | null;
    type?: string | null;
    isOpen?: boolean;
    description?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  onEdit: () => void;
  onOperatingHours: () => void;
  onTransfer: () => void;
}

export function OutletHero({
  outlet,
  onEdit,
  onOperatingHours,
  onTransfer,
}: OutletHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      {/* Image Banner */}
      <div className="relative h-40 md:h-52 overflow-hidden bg-muted">
        {outlet.image ? (
          <img
            src={outlet.image}
            alt={outlet.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <Store className="h-20 w-20 text-muted-foreground/20" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Badges overlay */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <Badge
            variant={outlet.isOpen ? "success" : "destructive"}
            className="text-[10px] font-bold uppercase tracking-wider shadow-sm"
          >
            {outlet.isOpen ? "Buka" : "Tutup"}
          </Badge>
          {outlet.type && (
            <Badge
              variant="outline"
              className="text-[10px] font-bold uppercase tracking-wider bg-black/30 text-white border-white/20 backdrop-blur-sm"
            >
              {outlet.type}
            </Badge>
          )}
        </div>

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            {outlet.name}
          </h1>
          {outlet.description && (
            <p className="text-xs md:text-sm text-white/70 mt-1 line-clamp-2 max-w-lg">
              {outlet.description}
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex items-center gap-2 p-3 md:p-4 border-t border-border/40 bg-muted/10 overflow-x-auto hide-scrollbar">
        <Button size="sm" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
          Edit Profil
        </Button>
        <Button variant="outline" size="sm" onClick={onOperatingHours}>
          <Clock className="h-3.5 w-3.5" />
          Jam Operasional
        </Button>
        <Button variant="outline" size="sm" onClick={onTransfer}>
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Transfer
        </Button>
      </div>
    </div>
  );
}
