export type BookingSlotStatus =
    "AVAILABLE" |
    "BOOKED" |
    "BLOCKED"

export interface BookingSlot {
    id: string;
    startTime: string;
    endTime: string;
    date: string;
    status: BookingSlotStatus
}