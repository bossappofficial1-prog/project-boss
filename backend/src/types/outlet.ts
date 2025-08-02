import { BookingSlot, OutletOperatingHours, ServiceCapacity } from "@prisma/client";

export interface OutletWithAvailability {
    id: string;
    name: string;
    operatingHours: OutletOperatingHours[];
    serviceProducts: Array<{
        id: string;
        name: string;
        price: number;
        serviceDurationMinutes: number;
        capacity: ServiceCapacity;
        availableSlots: BookingSlot[];
    }>;
}

export interface OutletAvailabilityQuery {
    date?: Date;
    productId?: string;
}
