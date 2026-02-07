"use client";

import { Product } from "@/types/product";
import { useEffect, useState } from "react";
import { BookingSlot, SelectedSchedule } from "@/types/booking-slots";
import { useGetSlotProduct } from "@/hooks/useBookingSlot";
import { formatIsoToTime } from "@/lib/utils";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { CalendarIcon, Timer } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import { EmptyState, LoadingState } from "../Base";
import { useCart } from "@/hooks/useCart";
import { getServiceDuration } from "@/lib/utils/product";

export function ScheduleModal({
  isOpen,
  onClose,
  onSelectSchedule,
  product,
  outletId,
  isOutletOpen = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectSchedule: (selection: SelectedSchedule) => void;
  product: Partial<Product>;
  outletId?: string;
  isOutletOpen?: boolean;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [scheduleSlots, setScheduleSlots] = useState<BookingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const { getSelectedSlot, getServiceInCart, checkTimeConflict } = useCart();
  const selectedSlotIdInCart = selectedSlot?.id ? getSelectedSlot(selectedSlot.id) : "";

  // Check if this service is already in cart for the same outlet
  const existingServiceInCart =
    product.type === "SERVICE" && outletId ? getServiceInCart(product.id!, outletId) : null;

  const isReplaceMode = !!existingServiceInCart;

  // Logic to determine if "today" is disabled for booking
  const isTodayDisabled = product.service?.bookingInWorkHours === false && isOutletOpen;

  // Check for time conflicts when selecting a new slot
  const timeConflict =
    selectedSlot && outletId
      ? checkTimeConflict(outletId, {
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          date: selectedDate?.toISOString().split("T")[0] || "",
        })
      : null;

  const { data: fetchedSlots, isLoading: isSlotsLoading } = useGetSlotProduct(
    product.id!,
    selectedDate,
  );

  useEffect(() => {
    if (!selectedDate) {
      setScheduleSlots([]);
      return;
    }

    if (fetchedSlots && fetchedSlots.length > 0) {
      const mapped: BookingSlot[] = fetchedSlots.map((slot: any) => ({
        id: slot.id,
        startTime: formatIsoToTime(slot.startTime),
        endTime: formatIsoToTime(slot.endTime),
        date: slot.date,
        status: slot.status,
      }));

      setScheduleSlots(mapped);

      // If in replace mode and existing service has a slot, pre-select it
      if (isReplaceMode && existingServiceInCart?.selectedSlot) {
        const existingSlot = mapped.find((slot) => slot.id === existingServiceInCart.selectedSlot);
        if (existingSlot) {
          setSelectedSlot(existingSlot);
        }
      }

      return;
    } else {
      setScheduleSlots([]);
    }
  }, [selectedDate, fetchedSlots, isReplaceMode, existingServiceInCart]);

  const handleSlotSelect = (slot: BookingSlot) => {
    if (slot.status === "BOOKED") return;

    if (!isReplaceMode && outletId) {
      const conflict = checkTimeConflict(outletId, {
        startTime: slot.startTime,
        endTime: slot.endTime,
        date: selectedDate?.toISOString().split("T")[0] || "",
      });
    }

    setSelectedSlot(slot);
  };

  const handleConfirm = () => {
    if (!selectedSlot || !selectedDate) return;

    const slotData = {
      id: selectedSlot.id,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      date: selectedDate.toISOString().split("T")[0],
      status: selectedSlot.status,
    };

    onSelectSchedule({
      slot: slotData,
    });
    onClose();
  };

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedSlot(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isReplaceMode ? "Ganti Jadwal" : "Pilih Jadwal"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 px-1">
          {/* Product Info */}
          <div className="text-center">
            <h4 className="font-medium">{product.name}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Durasi: {getServiceDuration(product as Product) || 30} menit
            </p>
            {isReplaceMode && existingServiceInCart && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-xs text-amber-700">
                  Jadwal saat ini sudah dipilih. Pilih jadwal baru untuk mengganti.
                </p>
              </div>
            )}
            {timeConflict && !isReplaceMode && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs text-red-700">
                  Konflik waktu dengan layanan "{timeConflict.name}" ({timeConflict.slotStartTime} -{" "}
                  {timeConflict.slotEndTime})
                </p>
              </div>
            )}
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium mb-2">Pilih Tanggal</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal ${!selectedDate && "text-muted-foreground"}`}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pilih tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate || undefined}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    // Disable past dates
                    if (date < today) return true;

                    // Disable today if restriction applies
                    // We compare strictly with today's date (ignoring time)
                    if (isTodayDisabled && date.getTime() === today.getTime()) return true;

                    return false;
                  }}
                  initialFocus
                  required={true}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Schedule Slots */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium mb-2">Pilih Waktu</label>
              {isSlotsLoading ? (
                <LoadingState />
              ) : scheduleSlots.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {scheduleSlots.map((slot) => {
                    const now = new Date();
                    const isSameDayAsToday = selectedDate
                      ? selectedDate.toDateString() === now.toDateString()
                      : false;

                    // Disable slots that already passed for the selected day
                    let isPastSlot = false;
                    if (isSameDayAsToday && selectedDate) {
                      const [hoursStr, minutesStr] = slot.startTime.split(/[:.]/);
                      const slotStart = new Date(selectedDate);
                      const hours = Number(hoursStr ?? 0);
                      const minutes = Number(minutesStr ?? 0);
                      slotStart.setHours(hours, minutes, 0, 0);
                      isPastSlot = slotStart.getTime() <= now.getTime();
                    }

                    return (
                      <Button
                        key={slot.id}
                        variant={
                          slot.status === "BOOKED"
                            ? "outline"
                            : selectedSlot?.id === slot.id
                              ? "default"
                              : "outline"
                        }
                        disabled={
                          slot.status === "BOOKED" ||
                          slot.status === "BLOCKED" ||
                          slot.id === selectedSlotIdInCart ||
                          isPastSlot
                        }
                        className={`flex flex-col items-center p-3 text-sm 
                                                ${selectedSlot?.id === slot.id && "bg-green-500 text-white hover:bg-green-600"} ${slot.id === selectedSlotIdInCart && "bg-orange-500"}`}
                        onClick={() => handleSlotSelect(slot)}>
                        <span className="font-medium">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="Slot Tidak Tersedia" icon={<Timer />} />
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSlot || (!!timeConflict && !isReplaceMode)}
            className="flex-1">
            {!selectedSlot
              ? "Pilih Waktu"
              : timeConflict && !isReplaceMode
                ? "Konflik Waktu"
                : `${isReplaceMode ? "Ganti ke" : "Pesan"} ${selectedSlot.startTime} - ${selectedSlot.endTime}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
