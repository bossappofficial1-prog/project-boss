export type BookingSlotStatus =
    "AVAILABLE" |
    "BOOKED" |
    "BLOCKED"

export interface BookingSlot {
    id: string;
    startTime: string;
    endTime: string;
    date: string;
    status: BookingSlotStatus;
    staffId?: string | null;
    staffName?: string | null;
}

export interface SelectedSchedule {
    slot: {
        id: string;
        startTime: string;
        endTime: string;
        date: string;
        status: BookingSlotStatus;
    };
    staff?: {
        id: string;
        name: string;
    };
}