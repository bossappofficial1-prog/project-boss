"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { AdminDashboardActivityRecord } from "@/lib/apis/admin-dashboard";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, Clock3 } from "lucide-react";

interface ActivityTimelineProps {
    data?: AdminDashboardActivityRecord[];
    isLoading: boolean;
}

const statusIcon = (status: string) => {
    if (status === "SUCCESS") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (status === "REJECTED_MANUAL") return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return <Clock3 className="h-4 w-4 text-amber-500" />;
};

export function ActivityTimeline({ data = [], isLoading }: ActivityTimelineProps) {
    return (
        <Card className="border border-border/60 shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg">Aktivitas terbaru</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <Skeleton className="h-64 w-full" />
                ) : data.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada aktivitas terbaru.</p>
                ) : (
                    <div className="space-y-4">
                        {data.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 rounded-2xl border border-border/50 p-4">
                                <div className="rounded-full bg-muted p-2">
                                    {statusIcon(activity.status)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-semibold">#{activity.invoiceNumber}</p>
                                        <Badge variant="outline" className="rounded-full text-[10px] uppercase">
                                            {activity.status}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(activity.updatedAt).toLocaleString("id-ID", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                day: "2-digit",
                                                month: "short",
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {activity.business?.name ?? "-"} · {activity.business?.owner?.name ?? "Owner tidak diketahui"}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold">
                                        {formatCurrency(activity.amount)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
