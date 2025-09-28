'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check authentication status and load user
  const checkAuth = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.get('/auth/me');
      const userData = response.data.data.user;

      const fullUser: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role as UserRole,
        sessionId: userData.sessionId || userData.id
      };

      setUser(fullUser);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize auth check
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        await checkAuth();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkAuth]);

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Call logout API to clear HttpOnly cookie
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      setIsLoading(false);
      setUser(null);
      router.push('/auth/login');
    }
  }, [router]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  // Check if user has specific role
  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role;
  }, [user]);

  // Computed values
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
    isOwner
  };
}