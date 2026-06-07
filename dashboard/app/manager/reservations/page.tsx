"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import OwnerReservationsContent from "@/features/reservations/components/owner/owner-reservations-content";

export default function ManagerReservationsPage() {
  return (
    <PrivilegeGuard requiredPrivilege="OUTLET_MANAGEMENT">
      <OwnerReservationsContent />
    </PrivilegeGuard>
  );
}
