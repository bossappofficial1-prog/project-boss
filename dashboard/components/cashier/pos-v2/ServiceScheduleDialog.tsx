"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, Clock, Loader2, RefreshCw } from "lucide-react";
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
import { posV2Api } from "@/lib/apis/pos-v2";
import type { PosV2Product, BookingSlot } from "@/lib/apis/pos-v2";
import { cn } from "@/lib/utils";

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
    return `${format(s, "HH:mm", { locale: localeId })} - ${format(e, "HH:mm", { locale: localeId })}`;
};

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
        setDate(existingSelection?.startTimeIso ? format(new Date(existingSelection.startTimeIso), "yyyy-MM-dd") : today());
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
                prev && data.some((s) => s.id === prev && s.status === "AVAILABLE" && new Date(s.startTime).getTime() > Date.now())
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

    const selectedSlot = useMemo(() => slots.find((s) => s.id === selectedSlotId) ?? null, [slots, selectedSlotId]);

    const canConfirm = selectedSlot && selectedSlot.status === "AVAILABLE" && staffId && !staffLoading && new Date(selectedSlot.startTime).getTime() > now;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Pilih Jadwal Layanan</DialogTitle>
                    <DialogDescription>
                        {product ? `Atur jadwal untuk layanan ${product.name}.` : "Pilih layanan untuk melihat jadwal."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Date picker */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                            <Calendar className="h-4 w-4" /> Pilih tanggal
                        </label>
                        <div className="flex items-center gap-3">
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => { setDate(e.target.value); setSelectedSlotId(""); setStaffId(""); }}
                                min={today()}
                                className="w-full"
                            />
                            <Button variant="outline" size="icon" onClick={fetchSlots} disabled={loading} aria-label="Muat ulang slot">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Slots */}
                    <div className="space-y-3 max-h-[60dvh] overflow-y-scroll">
                        <p className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                            <Clock className="h-4 w-4" /> Slot tersedia
                        </p>

                        {error && (
                            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                                {error}
                            </div>
                        )}

                        {loading ? (
                            <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40">
                                Memuat slot jadwal...
                            </div>
                        ) : slots.length > 0 ? (
                            <div className="grid gap-2 sm:grid-cols-2">
                                {slots.map((slot) => {
                                    const isSelected = slot.id === selectedSlotId;
                                    const isPast = new Date(slot.startTime).getTime() <= now;
                                    const isDisabled = slot.status !== "AVAILABLE" || isPast;

                                    let slotLabel = "Tersedia";
                                    if (isPast) slotLabel = "Lewat";
                                    else if (slot.status === "BLOCKED") slotLabel = "Blocked";
                                    else if (slot.status !== "AVAILABLE") slotLabel = "Booked";

                                    return (
                                        <Button
                                            key={slot.id}
                                            type="button"
                                            variant={isSelected ? "default" : "outline"}
                                            onClick={() => { if (!isDisabled) { setSelectedSlotId(slot.id); setStaffId(""); } }}
                                            disabled={isDisabled}
                                            className={cn(
                                                "justify-between",
                                                isSelected && "bg-blue-600 text-white hover:bg-blue-500",
                                                isDisabled && slot.status === "BLOCKED" && "disabled:bg-orange-500 disabled:opacity-90 text-white disabled:hover:bg-orange-600",
                                                isDisabled && slot.status === "BOOKED" && "disabled:bg-red-500 disabled:opacity-90 text-white disabled:hover:bg-red-600",
                                            )}>
                                            <span className="text-sm font-semibold">
                                                {formatTimeRange(slot.startTime, slot.endTime)}
                                            </span>
                                            <Badge variant={isDisabled ? "outline" : "secondary"}>
                                                {slotLabel}
                                            </Badge>
                                        </Button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40">
                                Belum ada slot untuk tanggal ini. Pilih tanggal lain.
                            </div>
                        )}
                    </div>

                    {/* Staff loading / error */}
                    {selectedSlotId && staffLoading && (
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin" /> Memeriksa ketersediaan...
                        </div>
                    )}
                    {selectedSlotId && staffError && !staffLoading && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                            {staffError}
                        </div>
                    )}

                    {/* Summary */}
                    {selectedSlot && staffId && !staffLoading && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                            <p className="font-medium text-slate-700 dark:text-slate-200">Jadwal terpilih</p>
                            <p>{formatDate(selectedSlot.startTime)}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex gap-3 sm:justify-between">
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-initial">
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
                        className="flex-1 bg-blue-600 hover:bg-blue-500 sm:flex-initial">
                        {staffLoading ? "Memuat..." : "Simpan Jadwal"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
