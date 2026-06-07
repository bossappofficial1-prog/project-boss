"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import ProductsContent from "@/features/owner/products/products-content";

export default function ManagerProductsPage() {
  return (
    <PrivilegeGuard requiredPrivilege="PRODUCT_MANAGEMENT">
      <ProductsContent />
    </PrivilegeGuard>
  );
}
