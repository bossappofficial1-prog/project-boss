'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type User,
  type UserRole
} from '@/lib/auth';
import { apiClient } from '@/lib/apis/base';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
  isOwner: boolean;
}

const AUTH_SESSION_CACHE_KEY = 'auth-me-cache-v1';

function readCachedUser(): User | null {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

async function fetchAuthMe(): Promise<User> {
  const response = await apiClient.get('/auth/me');
  const userData = response.data.data.user;
  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    role: userData.role as UserRole,
    sessionId: userData.sessionId || userData.id,
  };
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user = null, isLoading } = useQuery<User | null>({
    queryKey: ['auth-me'],
    queryFn: fetchAuthMe,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    initialData: readCachedUser,
  });

  // Sync fresh data to sessionStorage
  useEffect(() => {
    if (user) {
      try {
        sessionStorage.setItem(AUTH_SESSION_CACHE_KEY, JSON.stringify(user));
      } catch { }
    }
  }, [user]);

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
    } catch { }
    queryClient.removeQueries({ queryKey: ['auth-me'] });
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

