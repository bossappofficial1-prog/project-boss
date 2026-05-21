"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import ProductsContent from "@/components/owner/products/ProductsContent";

export default function ManagerProductsPage() {
  return (
    <PrivilegeGuard requiredPrivilege="PRODUCT_MANAGEMENT">
      <ProductsContent />
    </PrivilegeGuard>
  );
}
