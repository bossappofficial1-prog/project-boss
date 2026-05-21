"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import OrdersContent from "@/components/owner/orders/OrdersContent";

export default function ManagerOrdersPage() {
  return (
    <PrivilegeGuard requiredPrivilege="ORDER_MANAGEMENT">
      <OrdersContent />
    </PrivilegeGuard>
  );
}
