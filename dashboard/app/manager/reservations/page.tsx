"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import OwnerReservationsContent from "@/components/owner/reservations/owner-reservations-content";

export default function ManagerReservationsPage() {
  return (
    <PrivilegeGuard requiredPrivilege="OUTLET_MANAGEMENT">
      <OwnerReservationsContent />
    </PrivilegeGuard>
  );
}
