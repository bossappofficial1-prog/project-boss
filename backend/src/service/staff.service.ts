import { BookingSlotStatus, StaffRole, StaffStatus } from "@prisma/client";
import { db } from "../config/prisma";

export interface StaffAvailabilityInput {
    outletId: string;
    startTime: Date;
    endTime: Date;
    excludeSlotId?: string;
}

export interface StaffAvailabilityResult {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    status: StaffStatus;
    role: StaffRole;
    isAvailable: boolean;
    conflicts: Array<{
        slotId: string;
        startTime: string;
        endTime: string;
        status: BookingSlotStatus;
    }>;
}

export async function getStaffAvailabilityForWindow({
    outletId,
    startTime,
    endTime,
    excludeSlotId,
}: StaffAvailabilityInput): Promise<StaffAvailabilityResult[]> {
    const staffMembers = (await db.staff.findMany({
        where: {
            outletId,
            role: StaffRole.SERVICE,
            status: StaffStatus.ACTIVE,
        },
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            status: true,
            role: true,
            bookings: {
                where: {
                    status: {
                        in: [BookingSlotStatus.BOOKED, BookingSlotStatus.BLOCKED],
                    },
                    startTime: { lt: endTime },
                    endTime: { gt: startTime },
                    ...(excludeSlotId
                        ? {
                            id: { not: excludeSlotId },
                        }
                        : {}),
                },
                select: {
                    id: true,
                    startTime: true,
                    endTime: true,
                    status: true,
                },
            },
        },
        orderBy: { name: "asc" },
    })) as Array<Record<string, any>>;

    return staffMembers.map((member) => ({
        id: member.id,
        name: member.name,
        phone: member.phone,
        email: member.email,
        status: member.status,
        role: member.role,
        conflicts: member.bookings.map((booking: { id: string; startTime: Date; endTime: Date; status: BookingSlotStatus }) => ({
            slotId: booking.id,
            startTime: booking.startTime.toISOString(),
            endTime: booking.endTime.toISOString(),
            status: booking.status,
        })),
        isAvailable: member.status === StaffStatus.ACTIVE && member.bookings.length === 0,
    }));
}
