"use client";

import { useState, useMemo } from "react";
import {
    ChevronLeft,
    ChevronRight,
    CalendarDays,
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, isToday } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { useOutletStore } from "@/stores/outlet.store";
import { useBookingCalendar } from "@/hooks/use-booking";
import { DayColumn } from "@/features/owner/booking-calendar/day-colom";
import { DAY_LABELS, HOUR_HEIGHT } from "@/features/owner/booking-calendar/utils";

export default function BookingCalendar() {
    const { selectedOutletId } = useOutletStore();

    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
        startOfWeek(new Date(), { weekStartsOn: 1 })
    );

    const [viewMode, setViewMode] = useState<"week" | "day">("week");
    const [selectedDay, setSelectedDay] = useState<Date>(new Date());
    const [filterProvider, setFilterProvider] = useState<string>("all");
    const [filterService, setFilterService] = useState<string>("all");

    const { data: bookingCalendar, isLoading } = useBookingCalendar({
        outletId: selectedOutletId!,
        startDate: currentWeekStart,
        endDate: selectedDay,
        providerName: filterProvider,
        productServiceId: filterService
    });

    const { START_HOUR, END_HOUR, HOURS } = useMemo(() => {
        if (!bookingCalendar?.operatingHours?.length) {
            return { START_HOUR: 8, END_HOUR: 21, HOURS: Array.from({ length: 21 - 8 + 1 }, (_, i) => 8 + i) };
        }
        let minHour = 24, maxHour = 0;
        bookingCalendar.operatingHours.forEach(oh => {
            if (oh.isOpen) {
                const openH = parseInt(oh.openTime.split(':')[0]);
                const closeH = parseInt(oh.closeTime.split(':')[0]);
                if (openH < minHour) minHour = openH;
                if (closeH > maxHour) maxHour = closeH;
            }
        });
        const start = minHour > 23 ? 8 : minHour;
        const end = maxHour < start ? start + 12 : maxHour;
        return { START_HOUR: start, END_HOUR: end, HOURS: Array.from({ length: end - start + 1 }, (_, i) => start + i) };
    }, [bookingCalendar?.operatingHours]);

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
    const visibleDays = viewMode === "week" ? weekDays : [selectedDay];

    const filteredSlots = useMemo(() => {
        if (!bookingCalendar?.slots) return [];
        return bookingCalendar.slots.filter((slot) => {
            if (filterProvider !== "all" && slot.providerName !== filterProvider) return false;
            if (filterService !== "all" && slot.serviceName !== filterService) return false;
            return true;
        });
    }, [bookingCalendar?.slots, filterProvider, filterService]);

    const handlePrev = () => {
        if (viewMode === "week") setCurrentWeekStart((d) => addDays(d, -7));
        else setSelectedDay((d) => addDays(d, -1));
    };

    const handleNext = () => {
        if (viewMode === "week") setCurrentWeekStart((d) => addDays(d, 7));
        else setSelectedDay((d) => addDays(d, 1));
    };

    const handleToday = () => {
        setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
        setSelectedDay(new Date());
    };

    const rangeLabel = viewMode === "week"
        ? `${format(weekDays[0], "d MMM", { locale: id })} – ${format(weekDays[6], "d MMM yyyy", { locale: id })}`
        : format(selectedDay, "EEEE, d MMMM yyyy", { locale: id });

    return (
        <div className="space-y-6">
            <SectionHeader title="Kalender Booking" description="Jadwal slot layanan berdasarkan minggu atau hari" icon={CalendarDays} />
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon-sm" onClick={handlePrev}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={handleToday}>Hari ini</Button>
                    <Button variant="outline" size="icon-sm" onClick={handleNext}><ChevronRight className="h-4 w-4" /></Button>
                </div>
                <span className="text-sm font-medium text-foreground">{rangeLabel}</span>
                <div className="ml-auto flex items-center gap-2">
                    <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground">
                        <option value="all">Semua Provider</option>
                        {bookingCalendar?.providers.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select value={filterService} onChange={(e) => setFilterService(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground">
                        <option value="all">Semua Layanan</option>
                        {bookingCalendar?.services.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                    <div className="flex items-center bg-muted rounded-lg p-0.5">
                        {(["week", "day"] as const).map((v) => (
                            <button key={v} type="button" onClick={() => setViewMode(v)} className={cn("text-xs px-3 py-1 rounded-md font-medium", viewMode === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>
                                {v === "week" ? "Minggu" : "Hari"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="border border-border/50 rounded-lg overflow-hidden bg-card min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">Memuat data kalender...</p>
                    </div>
                ) : !bookingCalendar ? (
                    <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center p-8">
                        <div className="bg-muted p-4 rounded-full">
                            <CalendarDays className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium text-lg">Belum Ada Data</p>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                Tidak ada data operasional atau layanan yang ditemukan untuk outlet ini.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex border-b border-border/50">
                            <div className="w-14 shrink-0 border-r border-border/50 bg-muted" />
                            {visibleDays.map((date, i) => (
                                <div key={i} className={cn("flex-1 py-2 text-center border-r border-border/50 last:border-r-0", isToday(date) ? "bg-primary/5" : "bg-muted")}>
                                    <p className="text-xs text-muted-foreground">{viewMode === "week" ? DAY_LABELS[i] : format(date, "EEEE", { locale: id })}</p>
                                    <p className="text-sm font-semibold tabular-nums">{format(date, "d")}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex overflow-y-auto" style={{ maxHeight: 600 }}>
                            <div className="w-14 shrink-0 border-r border-border/50 relative bg-muted/20">
                                {HOURS.map((h) => (
                                    <div
                                        key={h}
                                        className="text-right pr-2"
                                        style={{ height: HOUR_HEIGHT }}
                                    >
                                        <span className="text-xs text-muted-foreground tabular-nums leading-none">
                                            {h.toString().padStart(2, "0")}:00
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Day columns + Grid Overlay */}
                            <div className="flex flex-1 relative">
                                {visibleDays.map((date, i) => {
                                    const isCurrentDay = isToday(date);
                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                "flex-1 border-r border-border/50 last:border-r-0 relative",
                                                isCurrentDay && "bg-primary/[0.02]"
                                            )}
                                            style={{ height: HOURS.length * HOUR_HEIGHT }}
                                        >
                                            <DayColumn date={date} slots={filteredSlots} startHour={START_HOUR} />
                                        </div>
                                    );
                                })}

                                {/* Grid Lines Overlay */}
                                <div
                                    className="pointer-events-none absolute inset-0"
                                    style={{ height: HOURS.length * HOUR_HEIGHT }}
                                >
                                    {HOURS.map((_, i) => (
                                        <div
                                            key={i}
                                            className="h-16 border-b border-border/30 last:border-0"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}