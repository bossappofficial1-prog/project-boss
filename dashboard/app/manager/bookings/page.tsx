"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import BookingsContent from "@/features/owner/bookings/bookings-content";

export default function ManagerBookingsPage() {
  return (
    <PrivilegeGuard requiredPrivilege="SERVICE_MANAGEMENT">
      <BookingsContent />
    </PrivilegeGuard>
  );
}
