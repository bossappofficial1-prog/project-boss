'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnauthorizedPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const clearAuthAndRedirect = useCallback(() => {
        queryClient.removeQueries({ queryKey: ['auth-me'] });
        try { sessionStorage.removeItem('auth-me-cache-v2'); } catch {}
        router.push('/auth/login');
    }, [queryClient, router]);

    useEffect(() => {
        const timer = setTimeout(clearAuthAndRedirect, 5000);
        return () => clearTimeout(timer);
    }, [clearAuthAndRedirect]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-100 via-rose-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                        <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-poppins">
                        Akses Ditolak
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-gray-600 dark:text-gray-400 font-poppins">
                        Anda tidak memiliki izin untuk mengakses halaman ini. Pastikan Anda login dengan akun yang sesuai.
                    </p>
                    <div className="space-y-2">
                        <Button
                            onClick={clearAuthAndRedirect}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-poppins"
                        >
                            Kembali ke Login
                        </Button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                            Akan otomatis redirect dalam 5 detik...
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}