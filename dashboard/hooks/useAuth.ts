'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type User,
  type UserRole
} from '@/lib/auth';
import { apiClient } from '@/lib/apis/base';

interface Business {
  id: string
  name: string
  description: string
  bankAccount: string
  bankName: string
  accountHolder: string
  subscriptionEndDate: string
  subscriptionPlan: string
  subscriptionStartDate: string
  subscriptionStatus: string
  [key: string]: unknown;
}

interface AuthMeData {
  user: User;
  business: Business | null;
}

interface UseAuthReturn {
  user: User | null;
  business: Business | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
  isOwner: boolean;
}

const AUTH_SESSION_CACHE_KEY = 'auth-me-cache-v2';

function readCachedData(): AuthMeData | undefined {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    // Validate structure — reject stale/old-format cache
    if (!parsed?.user?.id || !parsed?.user?.role) return undefined;
    return parsed as AuthMeData;
  } catch {
    return undefined;
  }
}

async function fetchAuthMe(): Promise<AuthMeData> {
  const response = await apiClient.get('/auth/me');
  const responseData = response.data.data;
  const userData = responseData.user;
  const businessData = responseData.business ?? null;

  const user: User = {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    avatar: userData.avatar,
    phone: userData.phone,
    role: userData.role as UserRole,
    sessionId: userData.sessionId || userData.id,
    businessId: userData.businessId ?? businessData?.id,
    isVerified: userData.isVerified,
    provider: userData.provider,
  };

  console.log(userData, businessData)
  return { user, business: businessData };
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<AuthMeData>({
    queryKey: ['auth-me'],
    queryFn: fetchAuthMe,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    initialData: readCachedData,
  });

  const user = data?.user ?? null;
  const business = data?.business ?? null;

  // Sync fresh data to sessionStorage
  useEffect(() => {
    if (data) {
      try {
        sessionStorage.setItem(AUTH_SESSION_CACHE_KEY, JSON.stringify(data));
      } catch { }
    }
  }, [data]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data.success) {
        await queryClient.invalidateQueries({ queryKey: ['auth-me'] });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch { }
    try {
      sessionStorage.removeItem(AUTH_SESSION_CACHE_KEY);
      sessionStorage.removeItem('user-data-cache-v1');
    } catch { }
    queryClient.removeQueries({ queryKey: ['auth-me'] });
    queryClient.removeQueries({ queryKey: ['user-data'] });
    router.push('/auth/login');
  }, [queryClient, router]);

  const refreshUser = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['auth-me'] });
  }, [queryClient]);

  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role;
  }, [user]);

  const isAuthenticated = !!user;
  const isAdmin = hasRole('ADMIN');
  const isOwner = hasRole('OWNER');

  return {
    user,
    business,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    hasRole,
    isAdmin,
    isOwner,
  };
}

