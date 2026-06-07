"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import { IngredientContent } from "@/features/owner/ingredients/ingredient-content";

export default function ManagerIngredientsPage() {
  return (
    <PrivilegeGuard requiredPrivilege="INGREDIENT_MANAGEMENT">
      <IngredientContent />
    </PrivilegeGuard>
  );
}
