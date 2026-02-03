"use client";

import React from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, Clock, Loader2, RefreshCw } from "lucide-react";

import type { POSProduct } from "@/types/pos";
import { apiClient } from "@/lib/apis/base";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface BookingSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "BOOKED" | "BLOCKED";
}

interface Staff {
  id: string;
  name: string;
}

export interface ServiceScheduleSelection {
  slotId: string;
  startTimeIso: string;
  endTimeIso: string;
  staffId: string;
}

interface ServiceScheduleDialogProps {
  open: boolean;
  product: POSProduct | null;
  existingSelection?: ServiceScheduleSelection | null;
  onClose: () => void;
  onConfirm: (selection: ServiceScheduleSelection) => void;
}

const formatDateLabel = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return format(date, "EEEE, dd MMM yyyy", { locale: id });
};

const formatTimeRange = (startIso: string, endIso: string) => {
  const start = new Date(startIso);
  const end = new Date(endIso);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "-";
  }

  const from = format(start, "HH:mm", { locale: id });
  const to = format(end, "HH:mm", { locale: id });
  return `${from} - ${to}`;
};

const todayIso = () => format(new Date(), "yyyy-MM-dd");

export function ServiceScheduleDialog({
  open,
  product,
  existingSelection,
  onClose,
  onConfirm,
}: ServiceScheduleDialogProps) {
  const [selectedDate, setSelectedDate] = React.useState<string>(todayIso);
  const [slots, setSlots] = React.useState<BookingSlot[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = React.useState("");

  // Staff is auto-selected (first available)
  const [staffId, setStaffId] = React.useState("");
  const [isLoadingStaff, setIsLoadingStaff] = React.useState(false);
  const [staffError, setStaffError] = React.useState<string | null>(null);

  const nowTs = Date.now();

  React.useEffect(() => {
    if (!open) {
      setSlots([]);
      setSelectedSlotId("");
      setError(null);
      setStaffId("");
      setStaffError(null);
      return;
    }

    const initialDate = existingSelection?.startTimeIso
      ? format(new Date(existingSelection.startTimeIso), "yyyy-MM-dd")
      : todayIso();

    setSelectedDate(initialDate);
    setSelectedSlotId(existingSelection?.slotId ?? "");
    setStaffId(existingSelection?.staffId ?? "");
  }, [open, existingSelection]);

  const loadSlots = React.useCallback(async () => {
    if (!open || !product?.id || !selectedDate) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(
        `/products/${product.id}/booking-slots?date=${selectedDate}`,
      );
      const data: BookingSlot[] = Array.isArray(response.data?.data) ? response.data.data : [];
      setSlots(data);

      setSelectedSlotId((current) => {
        if (!current) return current;
        const stillAvailable = data.some((slot) => {
          const slotStart = new Date(slot.startTime).getTime();
          return slot.id === current && slot.status === "AVAILABLE" && slotStart > Date.now();
        });
        return stillAvailable ? current : "";
      });
    } catch (err) {
      console.error("Failed to load booking slots", err);
      setSlots([]);
      setError("Tidak dapat memuat jadwal tersedia. Coba pilih tanggal lain atau muat ulang.");
    } finally {
      setIsLoading(false);
    }
  }, [open, product?.id, selectedDate]);

  // Auto-fetch and select first available staff when slot is selected
  const loadStaff = React.useCallback(async () => {
    if (!product?.id || !selectedSlotId) {
      setStaffId("");
      return;
    }

    setIsLoadingStaff(true);
    setStaffError(null);

    try {
      const response = await apiClient.get(
        `/products/${product.id}/available-staff?slotId=${selectedSlotId}`,
      );
      const data: Staff[] = Array.isArray(response.data?.data?.staff)
        ? response.data.data.staff
        : [];

      // Auto-select first staff (since each service has one staff)
      if (data.length > 0) {
        setStaffId(data[0].id);
      } else {
        setStaffId("");
        setStaffError("Tidak ada staff tersedia untuk slot ini");
      }
    } catch (err) {
      console.error("Failed to load available staff", err);
      setStaffId("");
      setStaffError("Tidak dapat memuat staff. Coba pilih slot lain.");
    } finally {
      setIsLoadingStaff(false);
    }
  }, [product?.id, selectedSlotId]);

  React.useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  React.useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const selectedSlot = React.useMemo(
    () => slots.find((slot) => slot.id === selectedSlotId) ?? null,
    [slots, selectedSlotId],
  );

  const handleConfirm = () => {
    if (!selectedSlot || selectedSlot.status !== "AVAILABLE") {
      return;
    }

    const slotStart = new Date(selectedSlot.startTime).getTime();
    if (slotStart <= Date.now()) {
      return;
    }

    if (!staffId) {
      setStaffError("Staff belum tersedia, pilih slot lain");
      return;
    }

    onConfirm({
      slotId: selectedSlot.id,
      startTimeIso: selectedSlot.startTime,
      endTimeIso: selectedSlot.endTime,
      staffId: staffId,
    });
  };

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setSelectedSlotId("");
    setStaffId("");
  };

  const handleSlotPick = (slotId: string) => {
    const slot = slots.find((item) => item.id === slotId);
    if (!slot || slot.status !== "AVAILABLE") {
      return;
    }

    const slotStart = new Date(slot.startTime).getTime();
    if (slotStart <= Date.now()) {
      return;
    }

    setSelectedSlotId(slotId);
    setStaffId(""); // Will be auto-fetched
  };

  const dateLabel = selectedSlot ? formatDateLabel(selectedSlot.startTime) : null;
  const timeLabel = selectedSlot
    ? formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)
    : null;

  const hasSlots = slots.length > 0;
  const hasAvailableSlots = slots.some((slot) => {
    const slotStart = new Date(slot.startTime).getTime();
    return slot.status === "AVAILABLE" && slotStart > nowTs;
  });

  const canConfirm =
    selectedSlot &&
    selectedSlot.status === "AVAILABLE" &&
    staffId &&
    !isLoadingStaff &&
    new Date(selectedSlot.startTime).getTime() > Date.now();

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Pilih Jadwal Layanan</DialogTitle>
          <DialogDescription>
            {product
              ? `Atur jadwal untuk layanan ${product.name}.`
              : "Pilih layanan untuk melihat jadwal."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Calendar className="h-4 w-4" />
              Pilih tanggal
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="date"
                value={selectedDate}
                onChange={(event) => handleDateChange(event.target.value)}
                min={todayIso()}
                className="w-full"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={loadSlots}
                disabled={isLoading}
                aria-label="Muat ulang slot">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            {existingSelection?.startTimeIso && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Jadwal saat ini: {formatDateLabel(existingSelection.startTimeIso)} (
                {formatTimeRange(existingSelection.startTimeIso, existingSelection.endTimeIso)})
              </p>
            )}
          </div>

          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Clock className="h-4 w-4" />
              Slot tersedia
            </p>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                Memuat slot jadwal...
              </div>
            ) : hasSlots ? (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  {slots.map((slot) => {
                    const isSelected = slot.id === selectedSlotId;
                    const slotStart = new Date(slot.startTime).getTime();
                    const isPast = slotStart <= nowTs;
                    const isDisabled = slot.status !== "AVAILABLE" || isPast;

                    return (
                      <Button
                        key={slot.id}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => handleSlotPick(slot.id)}
                        disabled={isDisabled}
                        title={isPast ? "Slot sudah melewati waktu mulai" : undefined}
                        className={
                          isSelected
                            ? "justify-between bg-red-600 text-white hover:bg-red-500"
                            : "justify-between border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        }>
                        <span className="text-sm font-semibold">
                          {formatTimeRange(slot.startTime, slot.endTime)}
                        </span>
                        <Badge
                          variant={
                            slot.status === "AVAILABLE" && !isPast ? "secondary" : "outline"
                          }>
                          {isPast ? "Lewat" : slot.status === "AVAILABLE" ? "Tersedia" : "Penuh"}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
                {!isLoading && hasSlots && !hasAvailableSlots && (
                  <p className="text-xs text-amber-600 dark:text-amber-300">
                    Semua slot pada tanggal ini sudah terlewat atau penuh. Pilih tanggal lain.
                  </p>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
                Belum ada slot untuk tanggal ini. Pilih tanggal lain.
              </div>
            )}
          </div>

          {/* Show loading or error for staff (without selection UI) */}
          {selectedSlotId && isLoadingStaff && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memeriksa ketersediaan...
            </div>
          )}

          {selectedSlotId && staffError && !isLoadingStaff && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
              {staffError}
            </div>
          )}

          {selectedSlot && staffId && !isLoadingStaff && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
              <p className="font-medium text-slate-700 dark:text-slate-200">Jadwal terpilih</p>
              <p>{dateLabel}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{timeLabel}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-initial">
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 bg-red-600 hover:bg-red-500 sm:flex-initial">
            {isLoadingStaff ? "Memuat..." : "Simpan Jadwal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ServiceScheduleDialog;
