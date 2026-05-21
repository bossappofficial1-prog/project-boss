"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import OwnerPage from "@/app/owner/profit-per-product/page";

export default function ManagerProfitPerProductPage() {
  return (
    <PrivilegeGuard requiredPrivilege="ANALYTICS">
      <OwnerPage />
    </PrivilegeGuard>
  );
}
