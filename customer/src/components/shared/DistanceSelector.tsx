"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { useTranslations } from "@/hooks/useI18n";

interface DistanceSelectorProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function DistanceSelector({
  value,
  onChange,
  className = "",
}: DistanceSelectorProps) {
  const t = useTranslations("nearbyPage");

  const distanceOptions = Array.from({ length: 20 }, (_, i) => i + 1); // 1 to 20 km

  return (
    <div className={`space-y-1 ${className}`}>
      <Select
        value={value.toString()}
        onValueChange={(val) => onChange(parseInt(val))}
      >
        <SelectTrigger className="w-24 border">
          <div className="flex items-center justify-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="text-foreground text-xs font-medium">
              {value} KM
            </span>
          </div>
        </SelectTrigger>
        <SelectContent className="min-w-30 max-h-48">
          {distanceOptions.map((distance) => (
            <SelectItem
              key={distance}
              value={distance.toString()}
              className="cursor-pointer hover:bg-muted/50 py-2 px-3"
            >
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                <span className="font-medium text-sm">
                  {distance} {t("distanceUnit")}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
