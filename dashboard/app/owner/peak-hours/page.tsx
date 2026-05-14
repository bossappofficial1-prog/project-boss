"use client";

import { useState } from "react";
import { Clock, TrendingUp, ShoppingCart, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { SectionHeader } from "@/components/ui/section-header";
import { SummaryCard } from "@/components/features/owner/report/SummaryCard";
import { useStoreState } from "@/stores/use-state";
import { formatCurrency } from "@/lib/utils";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { useTools } from "@/hooks/use-tools";
import { DateRangeFilter } from "@/components/ui/date-range-filter";

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return value.toString();
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

function HeatmapCell({
  value,
  maxValue,
  hour,
  dayName,
  displayLabel,
}: {
  value: number;
  maxValue: number;
  hour: number;
  dayName: string;
  displayLabel: string;
}) {
  const intensity = maxValue > 0 ? value / maxValue : 0;
  const [hovered, setHovered] = useState(false);

  const getBg = () => {
    if (value === 0) return "bg-muted";
    if (intensity > 0.8) return "bg-primary";
    if (intensity > 0.6) return "bg-primary/75";
    if (intensity > 0.4) return "bg-primary/50";
    if (intensity > 0.2) return "bg-primary/30";
    return "bg-primary/15";
  };

  return (
    <div className="relative group">
      <div
        className={`h-7 rounded-sm flex items-center justify-center cursor-default transition-opacity ${getBg()} ${hovered ? "ring-1 ring-primary ring-offset-1" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {hovered && value > 0 && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 bg-popover border border-border shadow-md rounded-md px-2 py-1 whitespace-nowrap pointer-events-none">
          <p className="text-xs font-medium">
            {dayName} {formatHour(hour)}
          </p>
          <p className="text-xs text-muted-foreground">{displayLabel}</p>
        </div>
      )}
    </div>
  );
}

const OPERATING_HOURS = Array.from({ length: 24 }, (_, i) => i); // 00:00 – 23:00

export default function JamRamai() {
  const { selectedOutletId } = useOutletContext();
  const {
    heatmapFilter,
    setHeatmapFilter,
    dateRange: dateRangeValue,
  } = useStoreState();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    dateRangeValue,
  );

  const { peakHours } = useTools(selectedOutletId!, {
    from: dateRange?.from!,
    to: dateRange?.to!,
  });

  console.log("Peak Hours Data:", JSON.stringify(peakHours.data));
  const data = peakHours.data;

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Memuat data...</p>
      </div>
    );
  }

  const maxOrderCount = Math.max(
    ...data.days.flatMap((d) =>
      d.slots
        .filter((s) => OPERATING_HOURS.includes(s.hour))
        .map((s) => s.orderCount),
    ),
  );

  const maxRevenue = Math.max(
    ...data.days.flatMap((d) =>
      d.slots
        .filter((s) => OPERATING_HOURS.includes(s.hour))
        .map((s) => s.revenue),
    ),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Analisis Jam Ramai"
        description="Pola transaksi berdasarkan hari dan jam operasional"
        actions={
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          // <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: <ShoppingCart className="h-4 w-4 text-muted-foreground" />,
            label: "Total Order",
            value: data.summary.totalOrders.toLocaleString("id-ID"),
            sub: `~${data.summary.avgOrdersPerDay} order/hari`,
          },
          {
            icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
            label: "Total Omzet",
            value: formatCompact(data.summary.totalRevenue),
            sub: `~${formatCompact(data.summary.avgRevenuePerDay)}/hari`,
          },
          {
            icon: <Clock className="h-4 w-4 text-muted-foreground" />,
            label: "Jam Paling Ramai",
            value: formatHour(data.summary.peakHour),
            sub: `${data.summary.peakHourOrders} order di jam ini`,
          },
          {
            icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
            label: "Hari Paling Ramai",
            value: data.summary.peakDay,
            sub: `${data.summary.peakDayOrders} order`,
          },
        ].map((item) => (
          <SummaryCard
            key={item.value}
            title={item.label}
            value={item.value}
            description={item.sub}
            icon={item.icon}
          />
        ))}
      </div>

      {/* Heatmap */}
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
              {data.days.map((day) => (
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

      {/* Per Day Breakdown */}
      <Card className="shadow-none gap-0 py-0 border-border/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-medium">
            Ringkasan per Hari
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="space-y-2">
            {[...data.days]
              .sort((a, b) => b.totalOrders - a.totalOrders)
              .map((day) => {
                const maxOrders = Math.max(
                  ...data.days.map((d) => d.totalOrders),
                );
                const pct = (day.totalOrders / maxOrders) * 100;
                return (
                  <div key={day.day} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-14 shrink-0">
                      {day.dayName}
                    </span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm tabular-nums font-medium w-8 text-right">
                      {day.totalOrders}
                    </span>
                    <span className="text-xs text-muted-foreground w-20 text-right tabular-nums">
                      {formatCompact(day.totalRevenue)}
                    </span>
                    {day.dayName === data.summary.peakDay && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        Terbaik
                      </Badge>
                    )}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
