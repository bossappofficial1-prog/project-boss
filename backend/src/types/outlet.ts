import { BookingSlot, OutletOperatingHours } from "@prisma/client";

export interface OutletWithAvailability {
    id: string;
    name: string;
    operatingHours: OutletOperatingHours[];
    serviceProducts: Array<{
        id: string;
        name: string;
        price: number;
        serviceDurationMinutes: number;
        availableSlots: BookingSlot[];
    }>;
}

export interface OutletAvailabilityQuery {
    date?: Date;
    productId?: string;
}
