'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { useUserData } from '@/hooks/useUserData';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { data: userData, isLoading, error, isError } = useUserData();

    // Auto-close sidebar on route change (mobile)
    useEffect(() => {
        const handleRouteChange = () => {
            if (window.innerWidth < 1024) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('popstate', handleRouteChange);
        return () => window.removeEventListener('popstate', handleRouteChange);
    }, []);

    // Handle authentication and authorization
    useEffect(() => {
        if (!isLoading) {
            if (isError || !userData?.user) {
                router.push('/auth/login');
                return;
            }

            if (userData.user.role !== 'ADMIN') {
                router.push('/unauthorized');
                return;
            }
        }
    }, [userData, isLoading, isError, router]);

    // Loading state with skeleton
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-100 dark:from-gray-900 dark:via-red-800/30 dark:to-gray-900 flex font-poppins">
                {/* Skeleton Sidebar */}
                <div className="fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col h-full">
                        {/* Logo Skeleton */}
                        <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-red-600 to-red-700">
                            <div className="h-6 bg-white/20 rounded w-32 animate-pulse"></div>
                        </div>

                        {/* User Info Skeleton */}
                        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Skeleton */}
                        <nav className="flex-1 px-3 py-4 space-y-2">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="flex items-center px-3 py-3">
                                    <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mr-3"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"></div>
                                </div>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Content Skeleton */}
                <div className="flex-1 lg:ml-64 flex flex-col">
                    {/* Header Skeleton */}
                    <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between h-16 px-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48"></div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    {/* Content Skeleton */}
                    <main className="flex-1 overflow-auto">
                        <div className="container mx-auto px-4 py-8">
                            <div className="space-y-6">
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-64"></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24 mb-2"></div>
                                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48 mb-4"></div>
                                    <div className="space-y-3">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // Error state
    if (isError || !userData?.user || userData.user.role !== 'ADMIN') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-100 dark:from-gray-900 dark:via-red-900/10 dark:to-gray-900 flex items-center justify-center font-poppins">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Access Denied
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {isError
                            ? 'Unable to verify your credentials. Please try logging in again.'
                            : 'You do not have permission to access the admin dashboard.'
                        }
                    </p>
                    <button
                        onClick={() => router.push('/auth/login')}
                        className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-gray-100 dark:from-gray-900 dark:via-red-800/30 dark:to-gray-900 flex font-poppins relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
            </div>

            {/* Sidebar */}
            <AdminSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* Mobile overlay with improved backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm lg:hidden animate-in fade-in duration-300 z-30"
                    onClick={() => setSidebarOpen(false)}
                    style={{ animationFillMode: 'forwards' }}
                />
            )}

            {/* Main content area */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out relative z-10
                ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}
                style={{ willChange: 'margin-left' }}
            >
                {/* Header with improved styling */}
                <div className={`sticky top-0 z-20 transition-all duration-300 ease-in-out
                    ${sidebarOpen
                        ? 'backdrop-blur-md bg-white/80 dark:bg-gray-800/80 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg'
                        : 'bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200/30 dark:border-gray-700/30 shadow-sm'
                    }`}>
                    <AdminHeader
                        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                        sidebarCollapsed={sidebarCollapsed}
                        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    />
                </div>

                {/* Content area with improved spacing and animations */}
                <main className={`flex-1 overflow-auto transition-all duration-300 ease-in-out
                    ${sidebarOpen ? 'blur-[1px] lg:blur-0 scale-[0.995] lg:scale-100' : 'blur-0 scale-100'}`}
                    style={{ willChange: 'filter, transform' }}
                >
                    <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
                        <div className="animate-in slide-in-from-bottom-4 duration-500">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}