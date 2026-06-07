"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import OwnerPage from "@/app/owner/profit-per-product/page";

export default function ManagerProfitPerProductPage() {
  return (
    <PrivilegeGuard requiredPrivilege="ANALYTICS">
      <OwnerPage />
    </PrivilegeGuard>
  );
}
