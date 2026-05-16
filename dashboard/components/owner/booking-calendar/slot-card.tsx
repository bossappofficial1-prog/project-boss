'use client'

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slot, SlotStatus } from "@/hooks/use-booking";
import { cn, timeToMinutes } from "@/lib/utils";
import { Clock, User } from "lucide-react";
import { HOUR_HEIGHT } from "./utils";

function slotTop(startTime: string, startHour: number): number {
    const minutes = timeToMinutes(startTime) - startHour * 60;
    return (minutes / 60) * HOUR_HEIGHT;
}

function slotHeight(startTime: string, endTime: string): number {
    const duration = timeToMinutes(endTime) - timeToMinutes(startTime);
    return (duration / 60) * HOUR_HEIGHT;
}

const STATUS_CONFIG: Record<SlotStatus, { bg: string; border: string; text: string; label: string }> = {
    AVAILABLE: {
        bg: "bg-muted",
        border: "border-border/50 border-dashed",
        text: "text-muted-foreground",
        label: "Tersedia",
    },
    BOOKED: {
        bg: "bg-primary/10",
        border: "border-primary/30",
        text: "text-primary",
        label: "Terbooking",
    },
    BLOCKED: {
        bg: "bg-destructive/10",
        border: "border-destructive/30",
        text: "text-destructive",
        label: "Diblokir",
    },
};

export function SlotCard({
    slot,
    startHour,
    style
}: {
    slot: Slot;
    startHour: number;
    style?: React.CSSProperties;
}) {
    const cfg = STATUS_CONFIG[slot.status];
    const height = slotHeight(slot.startTime, slot.endTime);
    const top = slotTop(slot.startTime, startHour);
    const isCompact = height < 48;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div
                    className={cn(
                        "absolute rounded-md border px-1.5 py-1 cursor-pointer overflow-hidden",
                        cfg.bg,
                        cfg.border,
                    )}
                    style={{
                        top: top,
                        height: Math.max(height - 2, 20),
                        ...style
                    }}
                >
                    {!isCompact && (
                        <>
                            <p className={cn("text-xs font-medium truncate leading-tight", cfg.text)}>
                                {slot.serviceName}
                            </p>
                            {slot.customer && (
                                <p className="text-xs text-muted-foreground truncate leading-tight">
                                    {slot.customer.name}
                                </p>
                            )}
                        </>
                    )}
                    {isCompact && (
                        <p className={cn("text-xs font-medium truncate leading-none", cfg.text)}>
                            {slot.status === "AVAILABLE" ? "—" : slot.serviceName}
                        </p>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 shadow-none border-border/50" side="right" align="start">
                <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <Badge
                            variant="outline"
                            className={cn("text-xs rounded-sm", cfg.text, cfg.border)}
                        >
                            {cfg.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {slot.startTime} – {slot.endTime}
                        </span>
                    </div>

                    <div className="space-y-1">
                        <p className="text-sm font-medium">{slot.serviceName}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{slot.durationMinutes} menit · {slot.providerName}</span>
                        </div>
                    </div>

                    {slot.customer && (
                        <div className="pt-2 border-t border-border/50 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">{slot.customer.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground pl-4">{slot.customer.phone}</p>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}