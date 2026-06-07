"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, Clock, Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { posV2Api } from "@/lib/apis/pos-v2";
import type { PosV2Product, BookingSlot } from "@/lib/apis/pos-v2";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";

export interface ScheduleSelection {
    slotId: string;
    startTimeIso: string;
    endTimeIso: string;
    staffId: string;
}

interface ServiceScheduleDialogProps {
    open: boolean;
    product: PosV2Product | null;
    existingSelection?: ScheduleSelection | null;
    onClose: () => void;
    onConfirm: (selection: ScheduleSelection) => void;
}

const today = () => format(new Date(), "yyyy-MM-dd");

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "-" : format(d, "EEEE, dd MMM yyyy", { locale: localeId });
};

const formatTimeRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return "-";
    return `${format(s, "HH:mm")} – ${format(e, "HH:mm")}`;
};

function ErrorBanner({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            {message}
        </div>
    );
}

export function ServiceScheduleDialog({
    open,
    product,
    existingSelection,
    onClose,
    onConfirm,
}: ServiceScheduleDialogProps) {
    const [date, setDate] = useState(today());
    const [slots, setSlots] = useState<BookingSlot[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedSlotId, setSelectedSlotId] = useState("");
    const [staffId, setStaffId] = useState("");
    const [staffLoading, setStaffLoading] = useState(false);
    const [staffError, setStaffError] = useState<string | null>(null);

    const now = Date.now();

    useEffect(() => {
        if (!open) {
            setSlots([]);
            setSelectedSlotId("");
            setStaffId("");
            setError(null);
            setStaffError(null);
            return;
        }
        setDate(
            existingSelection?.startTimeIso
                ? format(new Date(existingSelection.startTimeIso), "yyyy-MM-dd")
                : today(),
        );
        setSelectedSlotId(existingSelection?.slotId ?? "");
        setStaffId(existingSelection?.staffId ?? "");
    }, [open, existingSelection]);

    const fetchSlots = useCallback(async () => {
        if (!open || !product?.id || !date) return;
        setLoading(true);
        setError(null);
        try {
            const data = await posV2Api.getBookingSlots(product.id, date);
            setSlots(data);
            setSelectedSlotId((prev) =>
                prev &&
                    data.some(
                        (s) =>
                            s.id === prev &&
                            s.status === "AVAILABLE" &&
                            new Date(s.startTime).getTime() > Date.now(),
                    )
                    ? prev
                    : "",
            );
        } catch {
            setSlots([]);
            setError("Tidak dapat memuat jadwal. Coba tanggal lain.");
        } finally {
            setLoading(false);
        }
    }, [open, product?.id, date]);

    const fetchStaff = useCallback(async () => {
        if (!product?.id || !selectedSlotId) {
            setStaffId("");
            return;
        }
        setStaffLoading(true);
        setStaffError(null);
        try {
            const { staff } = await posV2Api.getAvailableStaff(product.id, selectedSlotId);
            if (staff.length > 0) {
                setStaffId(staff[0].id);
            } else {
                setStaffId("");
                setStaffError("Tidak ada staff tersedia untuk slot ini");
            }
        } catch {
            setStaffId("");
            setStaffError("Gagal memuat staff, coba slot lain");
        } finally {
            setStaffLoading(false);
        }
    }, [product?.id, selectedSlotId]);

    useEffect(() => { fetchSlots(); }, [fetchSlots]);
    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    const selectedSlot = useMemo(
        () => slots.find((s) => s.id === selectedSlotId) ?? null,
        [slots, selectedSlotId],
    );

    const canConfirm =
        selectedSlot &&
        selectedSlot.status === "AVAILABLE" &&
        staffId &&
        !staffLoading &&
        new Date(selectedSlot.startTime).getTime() > now;

    const handleDateChange = (value: string) => {
        setDate(value);
        setSelectedSlotId("");
        setStaffId("");
    };

    const handleSlotSelect = (slotId: string) => {
        setSelectedSlotId(slotId);
        setStaffId("");
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Pilih Jadwal Layanan
                    </DialogTitle>
                    <DialogDescription>
                        {product
                            ? `Atur jadwal untuk layanan ${product.name}.`
                            : "Pilih layanan untuk melihat jadwal."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Date picker */}
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Tanggal</p>
                        <div className="flex items-center gap-2">
                            <DatePicker
                                value={date}
                                onValueChange={(value) => handleDateChange(value!)}
                                className="flex-1"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={fetchSlots}
                                disabled={loading}
                                aria-label="Muat ulang slot">
                                {loading
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <RefreshCw className="h-4 w-4" />
                                }
                            </Button>
                        </div>
                    </div>

                    {/* Slots */}
                    <div className="space-y-3">
                        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Clock className="h-4 w-4 text-primary" />
                            Slot Tersedia
                        </p>

                        {error && <ErrorBanner message={error} />}

                        {loading ? (
                            <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 py-8 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Memuat slot jadwal...
                            </div>
                        ) : slots.length > 0 ? (
                            <div className="grid max-h-[45dvh] gap-2 overflow-y-auto pr-0.5 sm:grid-cols-2">
                                {slots.map((slot) => {
                                    const isSelected = slot.id === selectedSlotId;
                                    const isPast = new Date(slot.startTime).getTime() <= now;
                                    const isBooked = slot.status === "BOOKED";
                                    const isBlocked = slot.status === "BLOCKED";
                                    const isDisabled = slot.status !== "AVAILABLE" || isPast;

                                    const statusLabel = isPast
                                        ? "Lewat"
                                        : isBlocked
                                            ? "Blocked"
                                            : isBooked
                                                ? "Booked"
                                                : "Tersedia";

                                    const statusVariant = isDisabled ? "outline" : "secondary";

                                    return (
                                        <button
                                            key={slot.id}
                                            type="button"
                                            disabled={isDisabled}
                                            onClick={() => handleSlotSelect(slot.id)}
                                            className={cn(
                                                "flex items-center justify-between rounded-md border px-3 py-2.5 text-left transition-colors",
                                                isSelected
                                                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                                                    : isDisabled
                                                        ? "cursor-not-allowed border-border bg-muted/30 opacity-60"
                                                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/30",
                                            )}>
                                            <div className="flex items-center gap-2">
                                                {isSelected && (
                                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                                                )}
                                                <span className={cn(
                                                    "text-sm font-semibold tabular-nums",
                                                    isSelected ? "text-primary" : isDisabled ? "text-muted-foreground" : "text-foreground",
                                                )}>
                                                    {formatTimeRange(slot.startTime, slot.endTime)}
                                                </span>
                                            </div>
                                            <Badge variant={statusVariant} className="rounded-sm text-xs">
                                                {statusLabel}
                                            </Badge>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed border-border bg-muted/10 py-8 text-center text-sm text-muted-foreground">
                                Belum ada slot untuk tanggal ini.
                                <br />
                                <span className="text-xs">Pilih tanggal lain.</span>
                            </div>
                        )}
                    </div>

                    {/* Staff status */}
                    {selectedSlotId && (
                        staffLoading ? (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Memeriksa ketersediaan staff...
                            </div>
                        ) : staffError ? (
                            <ErrorBanner message={staffError} />
                        ) : null
                    )}

                    {/* Summary */}
                    {selectedSlot && staffId && !staffLoading && (
                        <>
                            <Separator />
                            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-semibold text-foreground">Jadwal dipilih</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(selectedSlot.startTime)}
                                    </p>
                                    <p className="text-xs font-medium text-foreground">
                                        {formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 sm:flex-initial">
                        Batal
                    </Button>
                    <Button
                        type="button"
                        disabled={!canConfirm}
                        onClick={() => {
                            if (selectedSlot && staffId) {
                                onConfirm({
                                    slotId: selectedSlot.id,
                                    startTimeIso: selectedSlot.startTime,
                                    endTimeIso: selectedSlot.endTime,
                                    staffId,
                                });
                            }
                        }}
                        className="flex-1">
                        {staffLoading
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Memuat...</>
                            : "Simpan Jadwal"
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}