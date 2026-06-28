"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PlanUsageSnapshot } from "@/lib/apis/owner-subscription";
import {
  usageCardsConfig,
  calcUsagePercentage,
  formatLimitLabel,
} from "./helper";

interface Props {
  usage?: PlanUsageSnapshot;
}

export function UsageGrid({ usage }: Props) {
  if (!usage) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {usageCardsConfig.map((card) => {
        const data = (usage as any)?.[card.key];
        const limit = data?.limit;
        const used = data?.used;
        const remaining = data?.remaining;
        const percentage = calcUsagePercentage(used, limit);

        const Icon = card.icon;

        // Determine color based on usage
        const isHighUsage = percentage > 85;
        const isMediumUsage = percentage > 60;

        return (
          <Card
            key={card.key}
            className="group gap-0 relative overflow-hidden rounded-md border-border/80 bg-background shadow-sm transition-all duration-300 hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {card.label}
                </CardTitle>
                <p className="text-2xl font-black tracking-tight text-foreground tabular-nums">
                  {used ?? 0}
                </p>
              </div>
              <div
                className={cn(
                  "p-2.5 rounded-md transition-colors duration-300 bg-muted text-muted-foreground group-hover:bg-primary/20 border border-border/40",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-[10px] text-muted-foreground font-medium italic">
                {card.description}
              </p>

              {limit === -1 ? (
                <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 w-fit">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                    Tanpa Batas
                  </span>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-tighter mb-1">
                    <span className="text-muted-foreground">
                      Pemanfaatan Kuota
                    </span>
                    <span
                      className={cn(
                        isHighUsage
                          ? "text-rose-600"
                          : isMediumUsage
                            ? "text-amber-600"
                            : "text-foreground",
                      )}
                    >
                      {percentage}%
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted shadow-none">
                    <div
                      className={cn(
                        "h-full transition-all duration-1000 ease-in-out rounded-full",
                        isHighUsage
                          ? "bg-rose-500"
                          : isMediumUsage
                            ? "bg-amber-500"
                            : "bg-foreground",
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold mt-2">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span className="h-1 w-1 rounded-full bg-muted-foreground opacity-50" />
                      <span>
                        Sisa:{" "}
                        <span className="text-foreground">
                          {remaining ?? 0}
                        </span>
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-muted/30 border border-border/40 text-muted-foreground">
                      Limit {formatLimitLabel(limit)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
