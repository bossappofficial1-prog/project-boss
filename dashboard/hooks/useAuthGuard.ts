"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apis/base';

export function useAuthGuard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (checked) return; // Prevent multiple checks

    const checkAuth = async () => {
      try {
        const response = await apiClient.get('/auth/me');
        const userData = response.data.data.user;

        // For owner dashboard, allow both OWNER and ADMIN roles
        if (userData.role !== 'OWNER' && userData.role !== 'ADMIN') {
          router.push('/unauthorized');
          return;
        }

        setLoading(false);
        setChecked(true);
      } catch (error) {
        router.push('/auth/login');
      }
    };

    // Add small delay to prevent race conditions
    setTimeout(checkAuth, 100);
  }, [router, checked]);

  return { loading } as const;
}
