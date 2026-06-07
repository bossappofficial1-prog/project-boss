"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type FilterType = "daily" | "weekly" | "monthly";

interface DateFilterControlProps {
    filterType: FilterType;
    setFilterType: (type: FilterType) => void;
    onPrev: () => void;
    onNext: () => void;
    currentLabel: string;
    className?: string;
}

export function DateFilterControl({
    filterType,
    setFilterType,
    onPrev,
    onNext,
    currentLabel,
    className,
}: DateFilterControlProps) {
    return (
        <div className={cn(
            "flex flex-col sm:flex-row items-center justify-between gap-4 rounded-md border bg-card p-2 shadow-sm",
            className
        )}>
            <Tabs
                value={filterType}
                onValueChange={(val) => setFilterType(val as FilterType)}
                className="w-full sm:w-auto"
            >
                <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                    <TabsTrigger value="daily">Harian</TabsTrigger>
                    <TabsTrigger value="weekly">Mingguan</TabsTrigger>
                    <TabsTrigger value="monthly">Bulanan</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onPrev}
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous date</span>
                </Button>

                <div className="flex items-center justify-center gap-2 min-w-[160px] px-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground tracking-tight">
                        {currentLabel}
                    </span>
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onNext}
                >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next date</span>
                </Button>
            </div>
        </div>
    );
}