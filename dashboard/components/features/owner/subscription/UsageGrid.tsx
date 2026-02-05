import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PlanUsageSnapshot } from "@/lib/apis/owner-subscription";
import { usageCardsConfig, calcUsagePercentage, formatLimitLabel } from "./helper";

interface Props {
    usage?: PlanUsageSnapshot;
}

export function UsageGrid({ usage }: Props) {
    if (!usage) return null;

    return (
        <section className="grid gap-4 md:grid-cols-3">
            {usageCardsConfig.map((card) => {
                const data = (usage as any)?.[card.key];
                const limit = data?.limit;
                const used = data?.used;
                const remaining = data?.remaining;
                const percentage = calcUsagePercentage(used, limit);

                const Icon = card.icon;
                return (
                    <Card key={card.key} className={cn("border shadow-sm")}> {/* accent placeholder kept simple */}
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-foreground">{card.label}</CardTitle>
                            <div className="rounded-lg bg-white/20 p-2">
                                <Icon className="h-5 w-5 text-red-500" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-semibold text-foreground">{used ?? 0}</p>
                            <p className="text-xs text-muted-foreground">{card.description}</p>
                            {limit === -1 ? (
                                <p className="mt-3 text-xs font-semibold text-emerald-600">Tanpa batas</p>
                            ) : (
                                <>
                                    <Progress value={percentage} className="mt-3 h-2 bg-white/80" />
                                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{remaining ?? 0} sisa kuota</span>
                                        <span>Limit {formatLimitLabel(limit)}</span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </section>
    );
}
