'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ThemeToggle from '../ThemeToggle';
import { useUserData } from '@/hooks/useUserData';
import { apiClient } from '@/lib/apis/base';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface AdminHeaderProps {
    onToggleSidebar: () => void;
    sidebarCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export default function AdminHeader({ onToggleSidebar, sidebarCollapsed = false, onToggleCollapse }: AdminHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: userData, isLoading } = useUserData();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when shown
    useEffect(() => {
        if (showSearch && searchRef.current) {
            searchRef.current.focus();
        }
    }, [showSearch]);

    const handleLogoutClick = () => {
        setDropdownOpen(false);
        setShowLogoutModal(true);
    };

    const handleLogoutConfirm = async () => {
        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear any remaining localStorage data (for backward compatibility)
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/auth/login');
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Implement search functionality - could navigate to search results page
            console.log('Searching for:', searchQuery);
            setShowSearch(false);
            setSearchQuery('');
        }
    };

    // Generate breadcrumb from pathname
    const generateBreadcrumb = () => {
        const segments = pathname.split('/').filter(Boolean);
        const breadcrumbs = segments.map((segment, index) => {
            const href = '/' + segments.slice(0, index + 1).join('/');
            const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');
            return { label, href };
        });
        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumb();

    return (
        <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 lg:px-6 py-3 h-16">
                {/* Left side - Menu button, breadcrumbs, and title */}
                <div className="flex items-center flex-1 min-w-0">
                    {/* Mobile menu button */}
                    <button
                        onClick={onToggleSidebar}
                        className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 shadow-sm"
                        title="Open Menu"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Breadcrumb navigation - Desktop */}
                    <div className="hidden lg:flex items-center ml-4 space-x-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Admin</span>
                        {breadcrumbs.map((crumb, index) => (
                            <div key={crumb.href} className="flex items-center">
                                <svg className="w-4 h-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className={`text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 ${index === breadcrumbs.length - 1 ? 'font-medium text-gray-900 dark:text-gray-100' : ''}`}>
                                    {crumb.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Desktop sidebar toggle */}
                    {onToggleCollapse && (
                        <button
                            onClick={onToggleCollapse}
                            className="hidden lg:flex items-center justify-center w-8 h-8 ml-4 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-all duration-200 hover:scale-105"
                            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            <svg className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}

                    {/* Mobile title */}
                    <div className="ml-4 lg:hidden">
                        <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard'}
                        </h1>
                    </div>
                </div>

                {/* Right side - Search, notifications, and profile */}
                <div className="flex items-center space-x-2 lg:space-x-4">
                    {/* Search bar - Desktop */}
                    <div className="hidden lg:block relative">
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-64 pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-sm"
                            />
                            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </form>
                    </div>

                    {/* Mobile search toggle */}
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 lg:hidden"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>

                    {/* Notifications */}
                    <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 17H9a6 6 0 01-6-6V9a6 6 0 0110.293-4.293L15 9v8z" />
                        </svg>
                        {/* Notification badge */}
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>
                    </button>

                    <ThemeToggle />

                    {/* Profile dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
                        >
                            {isLoading ? (
                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                            ) : (
                                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-sm">
                                    <span className="text-white text-sm font-semibold">
                                        {userData?.user?.email?.charAt(0).toUpperCase() || 'A'}
                                    </span>
                                </div>
                            )}
                            <svg className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {dropdownOpen && (
                            <>
                                {/* Backdrop */}
                                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />

                                {/* Dropdown menu */}
                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 z-20 border border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200">
                                    {/* User info */}
                                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-sm">
                                                <span className="text-white font-semibold">
                                                    {userData?.user?.email?.charAt(0).toUpperCase() || 'A'}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                    {userData?.user?.email?.split('@')[0] || 'Admin'}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {userData?.user?.email || 'admin@example.com'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu items */}
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                router.push('/admin/profile');
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Profile
                                        </button>

                                        <button
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                router.push('/admin/settings');
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Settings
                                        </button>

                                        <button
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                router.push('/admin/support');
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Help & Support
                                        </button>
                                    </div>

                                    {/* Logout */}
                                    <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                                        <button
                                            onClick={handleLogoutClick}
                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile search bar */}
            {showSearch && (
                <div className="lg:hidden px-4 pb-3 animate-in slide-in-from-top-2 duration-200">
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search admin panel..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-sm"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </form>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </div>
                        <DialogTitle className="text-center">
                            Confirm Sign Out
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            Are you sure you want to sign out of your admin account? You'll be redirected to the login page.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex space-x-2 sm:space-x-2">
                        <button
                            onClick={() => setShowLogoutModal(false)}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleLogoutConfirm}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-200"
                        >
                            Sign Out
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </header>
    );
}