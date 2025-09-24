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
    try {
      // Since we use HttpOnly cookies, we can't access them via JavaScript
      // So we directly call the API to check auth status
      const response = await apiClient.get('/auth/me');
      const userData = response.data.data.user;

      const fullUser: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role as UserRole,
        sessionId: userData.sessionId || userData.id // Use sessionId from API or fallback to id
      };

      setUser(fullUser);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Only clear localStorage tokens, cookies will be handled by server
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
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
        // Since we use HttpOnly cookies, the server will set the cookie automatically
        // We just need to refresh user data
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
    try {
      // Call logout API to clear HttpOnly cookie
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      // Clear local state and localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
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