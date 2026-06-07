"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import OrdersContent from "@/features/orders/components/owner/orders-content";

export default function ManagerOrdersPage() {
  return (
    <PrivilegeGuard requiredPrivilege="ORDER_MANAGEMENT">
      <OrdersContent />
    </PrivilegeGuard>
  );
}
