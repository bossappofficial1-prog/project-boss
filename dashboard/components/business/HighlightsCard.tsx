"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Store, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface HighlightsCardProps {
    topOutlet?: { name: string; revenue: number };
    avgOrdersPerOutlet: number;
}

const fmtNumber = (v: number) => new Intl.NumberFormat("id-ID").format(v);

export function HighlightsCard({
    topOutlet,
    avgOrdersPerOutlet,
}: HighlightsCardProps) {
    return (
        <Card className="rounded-md gap-0 pt-0 flex-1 border-border/60 shadow-md overflow-hidden bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="border-b p-4 border-border/40 bg-muted/20">
                <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Sorotan Cepat
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
                <div className="space-y-1.5 group cursor-default">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Store className="h-3 w-3 group-hover:text-primary transition-colors" />
                        TOP OUTLET
                    </div>
                    <div>
                        <p className="text-base font-bold text-foreground">
                            {topOutlet?.name || "-"}
                        </p>
                        <p className="text-xs font-semibold text-primary">
                            {topOutlet ? formatCurrency(topOutlet.revenue) : "Belum ada data"}
                        </p>
                    </div>
                </div>

                <Separator className="bg-border/40" />

                <div className="space-y-1.5 group cursor-default">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <TrendingUp className="h-3 w-3 group-hover:text-chart-5 transition-colors" />
                        RATA-RATA PESANAN / OUTLET
                    </div>
                    <div>
                        <p className="text-base font-bold text-foreground tabular-nums">
                            {fmtNumber(avgOrdersPerOutlet)}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                            Berdasarkan total pesanan dibagi jumlah outlet aktif.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
