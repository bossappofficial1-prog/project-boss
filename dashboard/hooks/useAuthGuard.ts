"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useAuthGuard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

    if (!token || !user) {
      router.push('/auth/login');
      return;
    }

    try {
      JSON.parse(user);
      setLoading(false);
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/auth/login');
    }
  }, [router]);

  return { loading } as const;
}
