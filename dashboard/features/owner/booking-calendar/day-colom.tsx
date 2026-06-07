'use client'

import { Slot } from "@/hooks/use-booking";
import { timeToMinutes } from "@/lib/utils";
import { format, isToday } from "date-fns";
import { useMemo } from "react";
import { SlotCard } from "./slot-card";
import { HOUR_HEIGHT } from "./utils";

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

export function DayColumn({ date, slots, startHour }: { date: Date; slots: Slot[]; startHour: number }) {
    const daySlots = slots.filter((s) => s.date === fmt(date));
    const isCurrentDay = isToday(date);

    const layoutSlots = useMemo(() => {
        const sorted = [...daySlots].sort((a, b) => {
            const aStart = timeToMinutes(a.startTime);
            const bStart = timeToMinutes(b.startTime);
            if (aStart !== bStart) return aStart - bStart;
            return timeToMinutes(b.endTime) - timeToMinutes(a.endTime);
        });

        const columns: Slot[][] = [];
        const slotToColumn = new Map<string, number>();

        sorted.forEach(slot => {
            let colIndex = 0;
            while (true) {
                if (!columns[colIndex]) {
                    columns[colIndex] = [slot];
                    slotToColumn.set(slot.id, colIndex);
                    break;
                }

                const lastInCol = columns[colIndex][columns[colIndex].length - 1];
                if (timeToMinutes(slot.startTime) >= timeToMinutes(lastInCol.endTime)) {
                    columns[colIndex].push(slot);
                    slotToColumn.set(slot.id, colIndex);
                    break;
                }
                colIndex++;
            }
        });

        return sorted.map(slot => {
            const colIndex = slotToColumn.get(slot.id)!;

            const slotStart = timeToMinutes(slot.startTime);
            const slotEnd = timeToMinutes(slot.endTime);

            const concurrentSlots = sorted.filter(s => {
                const sStart = timeToMinutes(s.startTime);
                const sEnd = timeToMinutes(s.endTime);
                return sStart < slotEnd && sEnd > slotStart;
            });

            const maxColInGroup = Math.max(...concurrentSlots.map(s => slotToColumn.get(s.id)!)) + 1;

            return {
                slot,
                style: {
                    left: `${(colIndex / maxColInGroup) * 100}%`,
                    width: `${(1 / maxColInGroup) * 100}%`,
                    paddingRight: "2px" // gutter
                }
            };
        });
    }, [daySlots]);

    return (
        <div className="flex-1 min-w-0 p-2 relative">
            {layoutSlots.map(({ slot, style }) => (
                <SlotCard key={slot.id} slot={slot} startHour={startHour} style={style} />
            ))}

            {isCurrentDay && (() => {
                const now = new Date();
                const nowMinutes = now.getHours() * 60 + now.getMinutes();
                const startMinutes = startHour * 60;
                const top = ((nowMinutes - startMinutes) / 60) * HOUR_HEIGHT;
                return (
                    <div className="absolute left-0 right-0 z-10 flex items-center" style={{ top }}>
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        <div className="flex-1 h-px bg-primary" />
                    </div>
                );
            })()}
        </div>
    );
}
