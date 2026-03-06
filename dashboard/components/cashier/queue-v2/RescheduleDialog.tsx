"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isBefore, startOfToday } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import { CalendarIcon, Clock, Timer } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useQueueV2Reschedule } from "@/hooks/api/use-queue-v2";
import { usePosV2BookingSlots } from "@/hooks/api/use-pos-v2";
import type { QueueV2Entry } from "@/lib/apis/queue-v2";
import type { BookingSlot } from "@/lib/apis/pos-v2";

interface RescheduleDialogProps {
    entry: QueueV2Entry | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

type SlotWithStatus = BookingSlot & { computedStatus: "AVAILABLE" | "BOOKED" | "BLOCKED" | "PAST" };

function formatSlotTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
    });
}

export function RescheduleDialog({ entry, open, onOpenChange, onSuccess }: RescheduleDialogProps) {
    const reschedule = useQueueV2Reschedule();

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<SlotWithStatus | null>(null);

    const serviceItem = entry?.items.find((i) => i.productType === "SERVICE");
    const productId = serviceItem?.productId ?? "";
    const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

    const { data: rawSlots, isLoading: isSlotsLoading } = usePosV2BookingSlots(productId, dateStr);

    // Reset state ketika dialog dibuka
    useEffect(() => {
        if (entry && open) {
            const existing = entry.scheduledStart ? new Date(entry.scheduledStart) : null;
            setSelectedDate(existing);
            setSelectedSlot(null);
        }
    }, [entry, open]);

    // Reset selected slot ketika tanggal berubah
    useEffect(() => {
        setSelectedSlot(null);
    }, [dateStr]);

    const processedSlots = useMemo((): SlotWithStatus[] => {
        if (!rawSlots || !selectedDate) return [];

        const now = new Date();
        const isSameDay = format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");

        return rawSlots
            .map((slot) => {
                let computedStatus: SlotWithStatus["computedStatus"] = slot.status as any;

                if (isSameDay && slot.status === "AVAILABLE") {
                    const slotStart = new Date(slot.startTime);
                    if (slotStart.getTime() <= now.getTime()) {
                        computedStatus = "PAST";
                    }
                }

                return { ...slot, computedStatus };
            })
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [rawSlots, selectedDate]);

    const handleConfirm = async () => {
        if (!entry || !selectedSlot || !selectedDate) return;

        try {
            await reschedule.mutateAsync({
                orderId: entry.id,
                newSlotId: selectedSlot.id,
                newDate: selectedSlot.startTime,
                newStartTime: selectedSlot.startTime,
                newEndTime: selectedSlot.endTime,
            });
            toast.success(`Jadwal antrian #${entry.position} berhasil diperbarui.`);
            onOpenChange(false);
            onSuccess?.();
        } catch (error: any) {
            const message = error?.response?.data?.message ?? error?.message ?? "Gagal memperbarui jadwal.";
            toast.error(message);
        }
    };

    const handleClose = () => {
        setSelectedDate(null);
        setSelectedSlot(null);
        onOpenChange(false);
    };

    if (!entry) return null;

    const currentSlotId = entry.bookingSlot?.id;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-h-[90vh] flex flex-col p-0 overflow-hidden sm:max-w-md">
                <DialogHeader className="p-4 sm:p-6 pb-2 text-left">
                    <DialogTitle className="text-lg font-semibold">Reschedule Jadwal Booking</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 space-y-5">
                    {/* Info customer + layanan */}
                    <div className="bg-muted/40 border rounded-md p-3 flex flex-col gap-1">
                        <p className="font-medium text-sm text-foreground">{entry.customerName}</p>
                        <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                            <Timer className="w-3.5 h-3.5" />
                            <span>{serviceItem?.productName ?? entry.productName}</span>
                            {serviceItem?.duration && <span>· {serviceItem.duration} menit</span>}
                        </div>
                    </div>

                    {/* Date picker */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Tanggal Baru</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal h-11 rounded-md text-sm",
                                        !selectedDate && "text-muted-foreground",
                                    )}
                                >
                                    <CalendarIcon className="mr-3 h-4 w-4 opacity-70 shrink-0" />
                                    <span className="truncate">
                                        {selectedDate
                                            ? format(selectedDate, "EEEE, dd MMMM yyyy", { locale: idLocale })
                                            : "Pilih tanggal"}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-md" align="start">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate ?? undefined}
                                    onSelect={(date) => setSelectedDate(date ?? null)}
                                    disabled={(date) => isBefore(date, startOfToday())}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Slot grid */}
                    {selectedDate && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <label className="text-sm font-semibold text-foreground">Waktu Tersedia</label>
                            </div>

                            {isSlotsLoading ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <Skeleton key={i} className="h-14 rounded-md" />
                                    ))}
                                </div>
                            ) : processedSlots.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                                    {processedSlots.map((slot) => {
                                        const isSelected = selectedSlot?.id === slot.id;
                                        const isCurrentBooking = slot.id === currentSlotId;
                                        const isDisabled =
                                            ["BOOKED", "BLOCKED", "PAST"].includes(slot.computedStatus) ||
                                            isCurrentBooking;

                                        let label = formatSlotTime(slot.startTime);
                                        let sublabel = formatSlotTime(slot.endTime);
                                        if (slot.computedStatus === "PAST") { label = "Lewat"; sublabel = ""; }
                                        else if (slot.computedStatus === "BLOCKED") { label = "Blocked"; sublabel = ""; }
                                        else if (slot.computedStatus === "BOOKED") { label = "Penuh"; sublabel = ""; }
                                        else if (isCurrentBooking) { label = "Saat ini"; sublabel = ""; }

                                        return (
                                            <Button
                                                key={slot.id}
                                                variant={isSelected ? "default" : "outline"}
                                                disabled={isDisabled}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={cn(
                                                    "flex flex-col h-auto py-3 px-2 w-full gap-0.5",
                                                    isCurrentBooking && "border-primary ring-1 ring-primary bg-primary/5",
                                                    isSelected && "bg-green-500 hover:bg-green-600 text-white border-green-500",
                                                    (slot.computedStatus === "BOOKED" || slot.computedStatus === "BLOCKED") &&
                                                    "disabled:bg-red-500 disabled:opacity-90 text-white disabled:hover:bg-red-600",
                                                )}
                                            >
                                                <span className="font-semibold text-xs">{label}</span>
                                                {sublabel && (
                                                    <span className="text-[10px] opacity-75">{sublabel}</span>
                                                )}
                                            </Button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-md border bg-muted/30 py-8 text-center">
                                    <Timer className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">Tidak ada jadwal tersedia</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 sm:px-6 sm:py-4 border-t bg-background flex-row gap-2">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        className="flex-1 h-11 rounded-md"
                        disabled={reschedule.isPending}
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedSlot || reschedule.isPending}
                        className="flex-1 h-11 rounded-md"
                    >
                        {reschedule.isPending
                            ? "Menyimpan..."
                            : selectedSlot
                                ? `Ganti ke ${formatSlotTime(selectedSlot.startTime)}`
                                : "Pilih Waktu"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
