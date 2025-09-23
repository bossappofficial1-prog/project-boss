"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import { type UserRole } from '@/lib/auth';

interface UseAuthGuardOptions {
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  const { requiredRole, redirectTo = '/unauthorized' } = options;

  useEffect(() => {
    // Wait for auth check to complete
    if (isLoading || checked) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // If authenticated but no user data, wait
    if (!user) return;

    // Check role requirements
    if (requiredRole) {
      const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      const hasRequiredRole = requiredRoles.includes(user.role);

      if (!hasRequiredRole) {
        router.push(redirectTo);
        return;
      }
    }

    setChecked(true);
  }, [isLoading, isAuthenticated, user, requiredRole, redirectTo, router, checked]);

  return {
    loading: isLoading || !checked,
    user,
    isAuthenticated
  } as const;
}
