'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

    if (!userRaw) {
      router.push('/auth/login');
      return;
    }

    try {
      const user = JSON.parse(userRaw);
      if (user?.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/owner');
      }
    } catch {
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-linear-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center font-poppins">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-poppins">Loading...</p>
      </div>
    </div>
  );
}
