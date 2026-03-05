"use client";

import { useEffect, useState, useMemo } from "react";
import { format, isBefore, startOfToday } from "date-fns";
import { CalendarIcon, Timer, Info, AlertCircle, Clock } from "lucide-react";

import { Product } from "@/types/product";
import { BookingSlot, SelectedSchedule } from "@/types/booking-slots";
import { useGetSlotProduct } from "@/hooks/useBookingSlot";
import { useCart } from "@/hooks/useCart";
import { cn, formatIsoToTime } from "@/lib/utils";
import { getServiceDuration } from "@/lib/utils/product";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { EmptyState, LoadingState } from "../Base";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSchedule: (selection: SelectedSchedule) => void;
  product: Partial<Product>;
  outletId?: string;
  isOutletOpen?: boolean;
}

export function ScheduleModal({
  isOpen,
  onClose,
  onSelectSchedule,
  product,
  outletId,
  isOutletOpen = true,
}: ScheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);

  const { getSelectedSlot, getServiceInCart, checkTimeConflict } = useCart();

  // Data fetching
  const { data: fetchedSlots, isLoading: isSlotsLoading } = useGetSlotProduct(
    product.id!,
    selectedDate
  );

  // Derived states
  const existingServiceInCart = useMemo(() => {
    return product.type === "SERVICE" && outletId
      ? getServiceInCart(product.id!, outletId)
      : null;
  }, [product, outletId, getServiceInCart]);

  const isReplaceMode = !!existingServiceInCart;
  const isTodayDisabled = product.service?.bookingInWorkHours === false && isOutletOpen;

  const selectedSlotIdInCart = selectedSlot?.id ? getSelectedSlot(selectedSlot.id) : "";

  // Process, sort, and map slots
  const processedSlots = useMemo(() => {
    if (!fetchedSlots || !selectedDate) return [];

    const now = new Date();
    const isSameDayAsToday = selectedDate.toDateString() === now.toDateString();

    return fetchedSlots.map((slot: any) => {
      const startTime = formatIsoToTime(slot.startTime);
      const endTime = formatIsoToTime(slot.endTime);

      let computedStatus = slot.status; // 'AVAILABLE', 'BOOKED', 'BLOCKED'
      let isPastSlot = false;

      // Check if the slot has already passed today
      if (isSameDayAsToday) {
        const [hoursStr, minutesStr] = startTime.split(/[:.]/);
        const slotStart = new Date(selectedDate);
        slotStart.setHours(Number(hoursStr ?? 0), Number(minutesStr ?? 0), 0, 0);
        isPastSlot = slotStart.getTime() <= now.getTime();
      }

      if (isPastSlot) computedStatus = "PAST";

      return {
        id: slot.id,
        startTime,
        endTime,
        date: slot.date,
        status: slot.status, // Perbaikan: Menambahkan type status bawaan agar terdeteksi BookingSlot
        computedStatus,
      } as BookingSlot & { computedStatus: string };
    }).sort((a, b) => a.startTime.localeCompare(b.startTime)); // Perbaikan: Mengurutkan jadwal berdasarkan jam mulai
  }, [fetchedSlots, selectedDate]);

  // Handle auto-selecting existing slot in replace mode
  useEffect(() => {
    if (isReplaceMode && existingServiceInCart?.selectedSlot && processedSlots.length > 0) {
      const existing = processedSlots.find((s) => s.id === existingServiceInCart.selectedSlot);
      if (existing && !selectedSlot) {
        setSelectedSlot(existing);
      }
    }
  }, [processedSlots, isReplaceMode, existingServiceInCart, selectedSlot]);

  // Check for time conflicts whenever selectedSlot changes
  const timeConflict = useMemo(() => {
    if (!selectedSlot || !outletId || !selectedDate || isReplaceMode) return null;

    return checkTimeConflict(outletId, {
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      date: format(selectedDate, "yyyy-MM-dd"),
    });
  }, [selectedSlot, outletId, selectedDate, isReplaceMode, checkTimeConflict]);

  // Handlers
  const handleSlotSelect = (slot: BookingSlot & { computedStatus: string }) => {
    if (["BOOKED", "BLOCKED", "PAST"].includes(slot.computedStatus)) return;
    if (slot.id === selectedSlotIdInCart) return;

    setSelectedSlot(slot);
  };

  const handleConfirm = () => {
    if (!selectedSlot || !selectedDate) return;

    onSelectSchedule({
      slot: {
        id: selectedSlot.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        date: format(selectedDate, "yyyy-MM-dd"),
        status: selectedSlot.status,
      },
    });

    handleClose();
  };

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedSlot(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-md sm:rounded-2xl">
        <DialogHeader className="p-4 sm:p-6 pb-2 text-left">
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            {isReplaceMode ? "Ubah Jadwal Layanan" : "Pilih Jadwal Layanan"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 space-y-5">
          {/* Product Info Card */}
          <div className="bg-muted/40 border rounded-md p-3 sm:p-4 flex flex-col gap-1.5">
            <h4 className="font-medium text-[15px] sm:text-base text-foreground leading-tight">{product.name}</h4>
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
              <span>Durasi: {getServiceDuration(product as Product) || 30} menit</span>
            </div>
          </div>

          {/* Feedback Messages */}
          {isReplaceMode && existingServiceInCart && (
            <div className="flex items-start gap-2.5 p-3 bg-blue-50 text-blue-700 rounded-md text-xs sm:text-sm">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">Layanan ini sudah ada di keranjang. Silakan pilih waktu baru jika ingin mengganti jadwal.</p>
            </div>
          )}

          {timeConflict && !isReplaceMode && (
            <div className="flex items-start gap-2.5 p-3 bg-destructive/10 text-destructive rounded-md text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Bentrok dengan layanan <strong>"{timeConflict.name}"</strong> pada pukul{" "}
                {timeConflict.slotStartTime} - {timeConflict.slotEndTime}.
              </p>
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-foreground">Tanggal</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12 rounded-md text-sm",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-3 h-4 w-4 sm:h-5 sm:w-5 opacity-70 shrink-0" />
                  <span className="truncate">
                    {selectedDate ? format(selectedDate, "EEEE, dd MMMM yyyy") : "Pilih tanggal"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-md" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={(date) => setSelectedDate(date || null)}
                  disabled={(date) => {
                    const today = startOfToday();
                    if (isBefore(date, today)) return true;
                    if (isTodayDisabled && date.getTime() === today.getTime()) return true;
                    return false;
                  }}
                  initialFocus
                  required={false}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Schedule Slots */}
          {selectedDate && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-semibold text-foreground">Waktu Tersedia</label>
              </div>

              {isSlotsLoading ? (
                <div className="py-8">
                  <LoadingState />
                </div>
              ) : processedSlots.length > 0 ? (
                <div className="grid grid-cols-2 max-h-[75dvh] overflow-scroll sm:grid-cols-3 gap-2 sm:gap-2.5">
                  {processedSlots.map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id;
                    const isCurrentCartItem = slot.id === selectedSlotIdInCart;
                    const isDisabled = ["BOOKED", "BLOCKED", "PAST"].includes(slot.computedStatus) || isCurrentCartItem;

                    // Logika Text Label Dikembalikan Seperti Semula
                    let label = `${slot.startTime} - ${slot.endTime}`;
                    if (slot.computedStatus === "PAST") label = "Lewat";
                    else if (slot.computedStatus === "BLOCKED") label = "Blocked";
                    else if (slot.computedStatus === "BOOKED") label = "Booked";
                    else if (isCurrentCartItem) label = "Di Keranjang";

                    return (
                      <Button
                        key={slot.id}
                        variant={isSelected ? "default" : "outline"}
                        disabled={isDisabled}
                        onClick={() => handleSlotSelect(slot)}
                        className={cn(
                          "flex flex-col h-auto py-3 px-2 transition-all w-full",
                          {
                            "border-primary ring-1 ring-primary bg-primary/5": isCurrentCartItem && !isSelected,
                            // "opacity-50 bg-muted text-muted-foreground border-transparent": isDisabled && !isCurrentCartItem,
                            "bg-green-500 hover:bg-green-600": isSelected,
                            "disabled:bg-red-500 disabled:opacity-95 text-white disabled:hover:bg-red-600": slot.computedStatus === 'BLOCKED' || slot.computedStatus === 'BOOKED'
                          }
                        )}
                      >
                        <span className="font-semibold text-xs sm:text-sm">
                          {label}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 border rounded-md bg-muted/20">
                  <EmptyState title="Jadwal Penuh" icon={<Timer className="text-muted-foreground w-8 h-8" />} />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 sm:px-6 sm:py-4 border-t bg-background flex-row gap-2 sm:gap-3">
          <Button variant="ghost" onClick={handleClose} className="flex-1 h-11 sm:h-10 rounded-md">
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSlot || (!!timeConflict && !isReplaceMode)}
            className="flex-1 h-11 sm:h-10 rounded-md"
          >
            {!selectedSlot
              ? "Pilih Waktu"
              : timeConflict && !isReplaceMode
                ? "Waktu Bentrok"
                : `${isReplaceMode ? "Ganti ke" : "Konfirmasi"} ${selectedSlot.startTime}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}