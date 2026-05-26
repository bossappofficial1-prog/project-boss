"use client";

import PrivilegeGuard from "@/components/manager/shared/PrivilegeGuard";
import { RecipeContent } from "@/components/owner/recipes/RecipeContent";

export default function ManagerRecipesPage() {
  return (
    <PrivilegeGuard requiredPrivilege="RECIPE_MANAGEMENT">
      <RecipeContent />
    </PrivilegeGuard>
  );
}
