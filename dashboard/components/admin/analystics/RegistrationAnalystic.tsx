"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    TooltipProps,
    XAxis,
    YAxis
} from "recharts";
import { Users, ShieldCheck, Globe, Activity } from "lucide-react";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { Progress } from "@/components/ui/progress";

interface ChartDataPoint {
    label: string;
    total: number;
    verified: number;
}

interface InsightItem {
    label: string;
    percent: number;
    percentLabel: string;
    color?: string;
}

interface RegistrationAnalyticsProps {
    chartData?: ChartDataPoint[];
    roleInsights?: InsightItem[];
    verificationInsights?: InsightItem[];
    providerInsights?: InsightItem[];
    isRefetching?: boolean;
    sampleHint?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl outline-none ring-0">
                <div className="mb-2 text-xs font-medium text-muted-foreground">{label}</div>
                <div className="space-y-1">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm font-bold text-popover-foreground">
                                {entry.value}
                                <span className="ml-1 text-xs font-normal text-muted-foreground capitalize">
                                    {entry.name}
                                </span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-md bg-muted text-muted-foreground">
            <Icon size={14} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
        </span>
    </div>
);

const InsightRow = ({ item, colorClass = "bg-primary" }: { item: InsightItem, colorClass?: string }) => (
    <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{item.label}</span>
            <span className="text-xs font-mono text-muted-foreground">{item.percentLabel}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
                className={`h-full ${colorClass} transition-all duration-500 ease-in-out`}
                style={{ width: `${item.percent}%` }}
            />
        </div>
    </div>
);

export function RegistrationAnalytics({
    chartData = [],
    roleInsights = [],
    verificationInsights = [],
    providerInsights = [],
    isRefetching = false,
    sampleHint = "30 Hari Terakhir"
}: RegistrationAnalyticsProps) {

    return (
        <section className="grid gap-6 lg:grid-cols-3 lg:items-start">

            {/* --- LEFT CARD: TIMELINE CHART --- */}
            <Card className="lg:col-span-2 shadow-sm border-border/60">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" />
                                Timeline Registrasi
                            </CardTitle>
                            <CardDescription>
                                Tren pendaftar baru vs user terverifikasi.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {isRefetching && (
                                <Badge variant="outline" className="animate-pulse">
                                    Updating...
                                </Badge>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full border border-border/50">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                                    <span>Total</span>
                                </div>
                                <div className="h-3 w-[1px] bg-border"></div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                    <span>Verified</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                                    dy={10}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    width={35}
                                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    name="Total"
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="verified"
                                    name="Verified"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorVerified)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* --- RIGHT CARD: INSIGHTS & RATIOS --- */}
            <Card>
                <CardHeader>
                    <CardTitle>Rasio Role & Status</CardTitle>
                    <p className="text-sm text-muted-foreground">Terbatas pada sampel {sampleHint}</p>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div>
                        <p className="text-xs uppercase text-muted-foreground mb-2">Role</p>
                        <div className="space-y-3">
                            {roleInsights.map((role) => (
                                <div key={role.label} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm font-medium">
                                        <span>{role.label}</span>
                                        <span className="text-muted-foreground">{role.percentLabel}</span>
                                    </div>
                                    <Progress value={role.percent} className="h-2" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs uppercase text-muted-foreground mb-2">Verification</p>
                        <div className="space-y-3">
                            {verificationInsights.map((item) => (
                                <div key={item.label} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm font-medium">
                                        <span>{item.label}</span>
                                        <span className="text-muted-foreground">{item.percentLabel}</span>
                                    </div>
                                    <Progress value={item.percent} className="h-2" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs uppercase text-muted-foreground mb-2">Provider</p>
                        <div className="space-y-3">
                            {providerInsights.map((item) => (
                                <div key={item.label} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm font-medium">
                                        <span>{item.label}</span>
                                        <span className="text-muted-foreground">{item.percentLabel}</span>
                                    </div>
                                    <Progress value={item.percent} className="h-2" />
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}