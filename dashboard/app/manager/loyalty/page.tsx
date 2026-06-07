"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import LoyaltyContent from "@/features/owner/loyalty/loyalty-content";

export default function ManagerLoyaltyPage() {
  return (
    <PrivilegeGuard requiredPrivilege="CUSTOMER_MANAGEMENT">
      <LoyaltyContent />
    </PrivilegeGuard>
  );
}
