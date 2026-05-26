"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import { IngredientContent } from "@/components/owner/ingredients/IngredientContent";

export default function ManagerIngredientsPage() {
  return (
    <PrivilegeGuard requiredPrivilege="INGREDIENT_MANAGEMENT">
      <IngredientContent />
    </PrivilegeGuard>
  );
}
