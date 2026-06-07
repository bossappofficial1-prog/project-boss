"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import CustomerContent from "@/features/owner/customers/customer-content";

export default function ManagerCustomersPage() {
  return (
    <PrivilegeGuard requiredPrivilege="CUSTOMER_MANAGEMENT">
      <CustomerContent />
    </PrivilegeGuard>
  );
}
