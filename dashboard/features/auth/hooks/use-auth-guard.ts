"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './use-auth';
import { type UserRole } from '@/lib/auth';

interface UseAuthGuardOptions {
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
  onboardingCheck?: boolean;
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { requiredRole, redirectTo = '/unauthorized', onboardingCheck = false } = options;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Onboarding check: OWNER without businessId → redirect to register
    if (onboardingCheck && user && user.role === 'OWNER' && !user.businessId) {
      if (pathname?.startsWith('/auth/register')) return;

      const params = new URLSearchParams({
        step: user.isVerified ? '2' : '1',
        isVerified: String(user.isVerified ?? false),
        email: String(user.email),
      });
      if (user.provider) params.set('provider', user.provider);
      if (user.name) params.set('name', user.name);

      router.push(`/auth/register?${params.toString()}`);
      return;
    }

    if (requiredRole && user) {
      const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!requiredRoles.includes(user.role)) {
        router.push(redirectTo);
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, redirectTo, onboardingCheck, pathname, router]);

  return {
    loading: isLoading,
    user,
    isAuthenticated,
  } as const;
}

