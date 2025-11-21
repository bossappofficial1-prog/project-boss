import { BookingSlotStatus } from "./booking-slots";

export interface StaffAvailability {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
    role: string;
    isAvailable: boolean;
    conflicts: Array<{
        slotId: string;
        startTime: string;
        endTime: string;
        status: BookingSlotStatus;
    }>;
}

export interface StaffAvailabilityResponse {
    staff: StaffAvailability[];
    window: {
        startTime: string;
        endTime: string;
    };
    slotId: string | null;
}
