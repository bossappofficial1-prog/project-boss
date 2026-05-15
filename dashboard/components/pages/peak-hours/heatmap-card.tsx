"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { HeatmapCell } from "./heatmap-cell";
import { PeakHoursData } from "@/hooks/use-tools";

type HeatmapCardProps = {
  heatmapFilter: "orders" | "revenue";
  days: PeakHoursData["days"];
  setHeatmapFilter: (filter: "orders" | "revenue") => void;
};

const OPERATING_HOURS = Array.from({ length: 24 }, (_, i) => i);

export function HeatmapCard({
  heatmapFilter,
  days,
  setHeatmapFilter,
}: HeatmapCardProps) {
  const maxOrderCount = Math.max(
    ...days.flatMap((d) =>
      d.slots
        .filter((s) => OPERATING_HOURS.includes(s.hour))
        .map((s) => s.orderCount),
    ),
  );

  const maxRevenue = Math.max(
    ...days.flatMap((d) =>
      d.slots
        .filter((s) => OPERATING_HOURS.includes(s.hour))
        .map((s) => s.revenue),
    ),
  );
  return (
    <Card className="shadow-none gap-0 py-0 border-border/50">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            Heatmap Transaksi
          </CardTitle>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            {(["orders", "revenue"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setHeatmapFilter(m)}
                className={`text-xs px-3 py-1 rounded-md transition-colors ${
                  heatmapFilter === m
                    ? "bg-background shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "orders" ? "Order" : "Omzet"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 overflow-x-auto">
        <div className="min-w-160">
          {/* Hour labels */}
          <div className="flex gap-1 mb-1 pl-16">
            {OPERATING_HOURS.map((h) => (
              <div
                key={h}
                className="flex-1 text-center text-[10px] text-muted-foreground"
              >
                {h}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="space-y-1">
            {days.map((day) => (
              <div key={day.day} className="flex items-center gap-1">
                <div className="w-14 shrink-0 text-xs text-muted-foreground text-right pr-2">
                  {day.dayName}
                </div>
                {OPERATING_HOURS.map((hour) => {
                  const slot = day.slots.find((s) => s.hour === hour);
                  const value =
                    heatmapFilter === "orders"
                      ? (slot?.orderCount ?? 0)
                      : (slot?.revenue ?? 0);
                  const maxValue =
                    heatmapFilter === "orders" ? maxOrderCount : maxRevenue;
                  const displayLabel =
                    heatmapFilter === "orders"
                      ? `${slot?.orderCount ?? 0} order`
                      : formatCurrency(slot?.revenue ?? 0);

                  return (
                    <div key={hour} className="flex-1">
                      <HeatmapCell
                        value={value}
                        maxValue={maxValue}
                        hour={hour}
                        dayName={day.dayName}
                        displayLabel={displayLabel}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 justify-end">
            <span className="text-xs text-muted-foreground">Sedikit</span>
            {[0.1, 0.3, 0.5, 0.75, 1].map((v) => (
              <div
                key={v}
                className="h-4 w-6 rounded-sm"
                style={{ opacity: v, backgroundColor: "var(--primary)" }}
              />
            ))}
            <span className="text-xs text-muted-foreground">Banyak</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
