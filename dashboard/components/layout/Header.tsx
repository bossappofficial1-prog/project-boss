'use client';

import { apiClient } from '@/lib/apis/base';
import { useState } from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import ThemeToggle from '../ThemeToggle';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { useUserData } from '@/hooks/useUserData';

import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useOutletContext } from '../providers/OutletProvider';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function Header() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false)
  const { toggleSidebar, state } = useSidebar();
  const { user, isLoading: isUserLoading } = useAuth()

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      setLogoutLoading(true)
      const res = await apiClient.post('/auth/logout');
      if (res.status === 200) {
        try {
          sessionStorage.removeItem('auth-me-cache-v2');
          sessionStorage.removeItem('user-data-cache-v1');
        } catch { }
        window.location.href = '/auth/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally { setLogoutLoading(false) }
  };

  const getUserInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-300 dark:border-gray-600 bg-background/60 backdrop-blur-lg px-4 lg:px-6">
      {/* Left Section - Sidebar Toggle */}
      <div className="flex items-center gap-2">
        {/* Mobile Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="lg:hidden text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        {/* Desktop Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="hidden lg:flex text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          {state === 'collapsed' ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle sidebar collapse</span>
        </Button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Section */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        <Separator orientation="vertical" className="h-8 hidden sm:block" />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 gap-2 rounded-xl px-2 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Avatar className="h-8 w-8 bg-linear-to-br from-red-500 to-red-700 shadow-md">
                <AvatarImage src={user?.avatar ?? '/defaults/default-avatar.jpg'} />
                <AvatarFallback className="bg-transparent text-white text-sm font-bold">
                  {isUserLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    getUserInitials(user?.name)
                  )}
                </AvatarFallback>
              </Avatar>

              {/* User Info - Hidden on mobile */}
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                  {isUserLoading ? 'Loading...' : user?.name || 'User'}
                </span>
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {isUserLoading ? '...' : user?.role || 'Owner'}
                </span>
              </div>

              <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500 hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 rounded-xl shadow-xl border-gray-100 dark:border-gray-700"
          >
            {/* User Info Header */}
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {isUserLoading ? 'Loading...' : user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {isUserLoading ? '...' : user?.email || 'email@example.com'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
                    {isUserLoading ? '...' : user?.role || 'Owner'}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Menu Items */}
            <DropdownMenuItem
              className="cursor-pointer gap-2 py-2.5 focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-700 dark:focus:text-red-400"
            >
              <Link href={'/owner/profile'} className='flex gap-2 min-w-full'>
                <User className="h-4 w-4 text-red-500" />
                <span>Profil Saya</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer gap-2 py-2.5 focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-700 dark:focus:text-red-400"
            >
              <Link href={'/owner/settings'} className='flex gap-2 min-w-full'>
                <Settings className="h-4 w-4 text-red-500" />
                <span>Pengaturan</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuItem
              onClick={handleLogoutClick}
              className="cursor-pointer gap-2 py-2.5 text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-700 dark:focus:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        open={showLogoutModal}
        onOpenChange={setShowLogoutModal}
        title="Konfirmasi Keluar"
        description="Apakah Anda yakin ingin keluar dari akun Anda? Anda akan diarahkan ke halaman login."
        confirmText={logoutLoading ? "Loading..." : "Keluar"}
        cancelText="Batal"
        confirmVariant="destructive"
        onConfirm={handleLogoutConfirm}
        confirmDisabled={logoutLoading}
        icon={
          <LogOut className="h-6 w-6 text-red-600 dark:text-red-400" />
        }
      />
    </header>
  );
}