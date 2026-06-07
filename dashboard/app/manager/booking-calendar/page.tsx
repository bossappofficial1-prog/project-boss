"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import OwnerPage from "@/app/owner/booking-calendar/page";

export default function ManagerBookingCalendarPage() {
  return (
    <PrivilegeGuard requiredPrivilege="SERVICE_MANAGEMENT">
      <OwnerPage />
    </PrivilegeGuard>
  );
}
