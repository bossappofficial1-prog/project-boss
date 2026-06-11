"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./use-auth";
import { type UserRole } from "@/lib/auth";

interface UseAuthGuardOptions {
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
  onboardingCheck?: boolean;
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const {
    requiredRole,
    redirectTo = "/unauthorized",
    onboardingCheck = false,
  } = options;
  const hasCheckedOnboarding = useRef(false);

  // Reset onboarding check when user changes (e.g., after login/logout)
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.businessId) {
      hasCheckedOnboarding.current = true;
    }
    if (!isAuthenticated) {
      hasCheckedOnboarding.current = false;
    }
  }, [isLoading, isAuthenticated, user?.businessId]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (requiredRole && user) {
      const requiredRoles = Array.isArray(requiredRole)
        ? requiredRole
        : [requiredRole];
      if (!requiredRoles.includes(user.role)) {
        router.push(redirectTo);
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    requiredRole,
    redirectTo,
    onboardingCheck,
    pathname,
    router,
  ]);

  return {
    loading: isLoading,
    user,
    isAuthenticated,
  } as const;
}
