'use client'

import { ProductType } from "@/types"
import { useEffect, useState } from "react"
import { BookingSlot } from "@/types/booking-slots"
import { useGetSlotProduct } from "@/hooks/useBookingSlot"
import { formatIsoToTime } from "@/lib/utils"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Button } from "../ui/button"
import { CalendarIcon, Timer } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "../ui/calendar"
import { EmptyState, LoadingState } from "../Base"

export function ScheduleModal({
    isOpen,
    onClose,
    onSelectSchedule,
    product,
}: {
    isOpen: boolean
    onClose: () => void
    onSelectSchedule: (schedule: string) => void
    product: Partial<ProductType>
}) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [scheduleSlots, setScheduleSlots] = useState<BookingSlot[]>([])
    const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null)

    const { data: fetchedSlots, isLoading: isSlotsLoading, error: slotsError } = useGetSlotProduct(
        product.id!,
        selectedDate
    );

    useEffect(() => {
        if (!selectedDate) {
            setScheduleSlots([]);
            return
        }

        // If API returned slots, map them to BookingSlot shape and use them
        if (fetchedSlots && fetchedSlots.length > 0) {
            const mapped: BookingSlot[] = fetchedSlots.map((s: BookingSlot) => ({
                ...s,
                startTime: formatIsoToTime(s.startTime),
                endTime: formatIsoToTime(s.endTime)
            }));

            setScheduleSlots(mapped);
            return;
        } else {
            setScheduleSlots([])
        }

    }, [selectedDate, fetchedSlots])

    const handleSlotSelect = (slot: BookingSlot) => {
        if (slot.status === "BOOKED") return
        setSelectedSlot(slot)
    }

    const handleConfirm = () => {
        if (selectedSlot) {
            // onSelectSchedule(`${selectedSlot.date} ${selectedSlot.startTime} - ${selectedSlot.endTime}`)
            onSelectSchedule(selectedSlot.id)
            onClose()
        }
    }

    const handleClose = () => {
        setSelectedDate(null)
        setSelectedSlot(null)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Pilih Jadwal</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-6 px-1">
                    {/* Product Info */}
                    <div className="text-center">
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Durasi: {product.serviceDurationMinutes || 30} menit
                        </p>
                    </div>

                    {/* Date Picker */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Pilih Tanggal</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={`w-full justify-start text-left font-normal ${!selectedDate && "text-muted-foreground"}`}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "PPP") : "Pilih tanggal"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate || undefined}
                                    onSelect={setSelectedDate}
                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                            {isSlotsLoading
                                ? <LoadingState />
                                : scheduleSlots.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {scheduleSlots.map((slot) => (
                                            <Button
                                                key={slot.id}
                                                variant={
                                                    slot.status === "BOOKED"
                                                        ? "outline"
                                                        : selectedSlot?.id === slot.id
                                                            ? "default"
                                                            : "outline"
                                                }
                                                disabled={slot.status === "BOOKED" || slot.status === "BLOCKED"}
                                                className={`flex flex-col items-center p-3 text-sm 
                                                ${selectedSlot?.id === slot.id && "bg-green-500 text-white hover:bg-green-600"}`}
                                                onClick={() => handleSlotSelect(slot)}
                                            >
                                                <span className="font-medium">
                                                    {slot.startTime} - {slot.endTime}
                                                </span>
                                            </Button>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        title="Slot Tidak Tersedia"
                                        icon={<Timer />}
                                    />
                                )}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex gap-3">
                    <Button variant="outline" onClick={handleClose} className="flex-1">
                        Batal
                    </Button>
                    <Button onClick={handleConfirm} disabled={!selectedSlot} className="flex-1">
                        {selectedSlot
                            ? `Pesan ${selectedSlot.startTime} - ${selectedSlot.endTime}`
                            : "Pilih Waktu"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}