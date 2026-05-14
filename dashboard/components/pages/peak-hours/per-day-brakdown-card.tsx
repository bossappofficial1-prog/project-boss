"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumberCompactID } from "@/lib/utils";
import { PeakHoursData } from "@/hooks/use-tools";

export function PerDayBreakdownCard({
  days,
  summary,
}: {
  days: PeakHoursData["days"];
  summary: PeakHoursData["summary"];
}) {
  return (
    <Card className="shadow-none gap-0 py-0 border-border/50">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-medium">
          Ringkasan per Hari
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="space-y-2">
          {[...days]
            .sort((a, b) => b.totalOrders - a.totalOrders)
            .map((day) => {
              const maxOrders = Math.max(...days.map((d) => d.totalOrders));
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
                    {formatNumberCompactID(day.totalRevenue)}
                  </span>
                  {day.dayName === summary.peakDay && (
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
  );
}
