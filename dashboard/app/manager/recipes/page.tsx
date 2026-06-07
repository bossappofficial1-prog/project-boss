"use client";

import PrivilegeGuard from "@/components/shared/privilege-guard";
import { RecipeContent } from "@/features/owner/recipes/recipe-content";

export default function ManagerRecipesPage() {
  return (
    <PrivilegeGuard requiredPrivilege="RECIPE_MANAGEMENT">
      <RecipeContent />
    </PrivilegeGuard>
  );
}
