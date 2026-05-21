"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import CustomerContent from "@/components/owner/customers/CustomerContent";

export default function ManagerCustomersPage() {
  return (
    <PrivilegeGuard requiredPrivilege="CUSTOMER_MANAGEMENT">
      <CustomerContent />
    </PrivilegeGuard>
  );
}
