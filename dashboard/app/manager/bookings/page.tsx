"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import BookingsContent from "@/components/owner/bookings/BookingsContent";

export default function ManagerBookingsPage() {
  return (
    <PrivilegeGuard requiredPrivilege="SERVICE_MANAGEMENT">
      <BookingsContent />
    </PrivilegeGuard>
  );
}
