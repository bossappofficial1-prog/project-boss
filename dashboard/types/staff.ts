export type BookingSlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED';

export type StaffRole = 'CASHIER' | 'ADMIN';
export type StaffStatus = 'ACTIVE' | 'INACTIVE';

export interface StaffMember {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    status: StaffStatus;
    role: StaffRole;
    outletId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateStaffPayload {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    role: StaffRole;
    status: StaffStatus;
    outletId: string;
    password?: string | null;
}

export interface UpdateStaffPayload {
    name?: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    role?: StaffRole;
    status?: StaffStatus;
    password?: string | null;
}

export interface StaffAvailability {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
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
