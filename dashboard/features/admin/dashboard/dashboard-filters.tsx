"use client";

import { addDays, format } from "date-fns";
import { CalendarIcon, Sparkles } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import type { AdminDashboardInterval } from "@/lib/apis/admin-dashboard";

interface DashboardFiltersProps {
    dateRange: DateRange | undefined;
    onDateRangeChange: (range: DateRange | undefined) => void;
    interval: AdminDashboardInterval;
    onIntervalChange: (value: AdminDashboardInterval) => void;
}

const intervalOptions = [
    { label: "Harian", value: "day" },
    { label: "Mingguan", value: "week" },
    { label: "Bulanan", value: "month" },
];

export function DashboardFilters({ dateRange, onDateRangeChange, interval, onIntervalChange }: DashboardFiltersProps) {
    const label = dateRange?.from
        ? dateRange.to
            ? `${format(dateRange.from, "dd MMM yyyy")} - ${format(dateRange.to, "dd MMM yyyy")}`
            : format(dateRange.from, "dd MMM yyyy")
        : "Pilih rentang tanggal";

    const applyPreset = (days: number) => {
        const to = new Date();
        const from = addDays(to, -(days - 1));
        onDateRangeChange({ from, to });
    };

    return (
        <Card className="border-none bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl">
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-slate-400">
                        <Sparkles className="h-4 w-4" />
                        Mode Analitik
                    </div>
                    <p className="text-2xl font-semibold">Pantau metrik dalam rentang waktu yang fleksibel.</p>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                        <button
                            type="button"
                            onClick={() => applyPreset(7)}
                            className="rounded-full border border-white/10 px-3 py-1 transition hover:border-white/50"
                        >
                            7 hari terakhir
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset(30)}
                            className="rounded-full border border-white/10 px-3 py-1 transition hover:border-white/50"
                        >
                            30 hari terakhir
                        </button>
                        <button
                            type="button"
                            onClick={() => applyPreset(90)}
                            className="rounded-full border border-white/10 px-3 py-1 transition hover:border-white/50"
                        >
                            Kuartal berjalan
                        </button>
                    </div>
                </div>
                <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center md:justify-end">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="secondary"
                                className="w-full justify-start gap-2 rounded-xl border border-white/30 bg-white/10 text-left font-semibold text-white shadow-lg backdrop-blur md:w-[260px]"
                            >
                                <CalendarIcon className="h-4 w-4" />
                                <span className="truncate">{label}</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={onDateRangeChange}
                                numberOfMonths={2}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <SegmentedControl
                        id="dashboard-interval"
                        options={intervalOptions}
                        value={interval}
                        onChange={(value) => onIntervalChange(value as AdminDashboardInterval)}
                        size="sm"
                        className="rounded-full bg-white/10 p-1 text-xs font-semibold text-white backdrop-blur"
                    />
                </div>
            </CardContent>
        </Card>
    );
}