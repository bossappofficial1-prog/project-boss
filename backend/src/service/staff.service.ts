import { BookingSlotStatus, StaffStatus } from "@prisma/client";
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
      status: StaffStatus.ACTIVE,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      username: true,
      status: true,
    },
    orderBy: { name: "asc" },
  })) as Array<Record<string, any>>;

  // Query booking conflicts for this time window
  const conflictingBookings = await db.order.findMany({
    where: {
      handledByStaffId: { in: staffMembers.map((s) => s.id) },
      bookingDate: {
        gte: startTime,
        lt: endTime,
      },
      orderStatus: {
        in: ["AWAITING_PAYMENT", "PROCESSING", "CONFIRMED", "READY", "ON_GOING"],
      },
    },
    select: {
      handledByStaffId: true,
    },
  });

  const busyStaffIds = new Set(conflictingBookings.map((b) => b.handledByStaffId).filter(Boolean));

  return staffMembers.map((staff) => ({
    id: staff.id,
    name: staff.name,
    phone: staff.phone,
    username: staff.username,
    status: staff.status,
    conflicts: [], // No longer tracking individual conflicts, just availability
    isAvailable: !busyStaffIds.has(staff.id),
  }));
}
