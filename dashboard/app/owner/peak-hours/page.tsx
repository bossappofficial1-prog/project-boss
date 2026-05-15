"use client";

import { useState } from "react";
import { Clock, TrendingUp, ShoppingCart, DollarSign } from "lucide-react";
import { DateRange } from "react-day-picker";
import { SectionHeader } from "@/components/ui/section-header";
import { SummaryCard } from "@/components/features/owner/report/SummaryCard";
import { useStoreState } from "@/stores/use-state";
import { formatNumberCompactID } from "@/lib/utils";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { useTools } from "@/hooks/use-tools";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { formatHour } from "@/components/pages/peak-hours/utils";
import { PerDayBreakdownCard } from "@/components/pages/peak-hours/per-day-brakdown-card";
import { HeatmapCard } from "@/components/pages/peak-hours/heatmap-card";

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

  const data = peakHours.data;

  if (peakHours.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Memuat data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          Tidak ada data untuk rentang tanggal ini.
        </p>
      </div>
    );
  }

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
            value: formatNumberCompactID(data.summary.totalRevenue),
            sub: `~${formatNumberCompactID(data.summary.avgRevenuePerDay)}/hari`,
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
      <HeatmapCard
        days={data.days}
        heatmapFilter={heatmapFilter}
        setHeatmapFilter={setHeatmapFilter}
      />

      {/* Per Day Breakdown */}
      <PerDayBreakdownCard days={data.days} summary={data.summary} />
    </div>
  );
}
