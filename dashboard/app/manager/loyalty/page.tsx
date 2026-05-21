"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import LoyaltyContent from "@/components/owner/loyalty/LoyaltyContent";

export default function ManagerLoyaltyPage() {
  return (
    <PrivilegeGuard requiredPrivilege="CUSTOMER_MANAGEMENT">
      <LoyaltyContent />
    </PrivilegeGuard>
  );
}
