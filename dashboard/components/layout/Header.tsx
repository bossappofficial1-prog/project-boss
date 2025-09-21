'use client';

import { apiClient } from '@/lib/apis/base';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ThemeToggle from '../ThemeToggle';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
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
      localStorage.removeItem('selectedOutlet');
      router.push('/auth/login');
    }
  };

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg border-b border-red-100 dark:border-gray-700 sticky top-0 z-30">
      <div className="px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Left Section */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 sm:p-3 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                  <span className="text-white text-xs sm:text-sm font-bold font-poppins">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-poppins">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium font-poppins">
                    {user?.role || 'Owner'}
                  </p>
                </div>
                <svg
                  className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in slide-in-from-top-5 duration-200">
                  <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-poppins truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins truncate">
                      {user?.email || 'email@example.com'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      // Navigate to profile page when implemented
                    }}
                    className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 flex items-center font-poppins transition-colors duration-150"
                  >
                    <svg className="w-4 h-4 mr-2 sm:mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profil Saya
                  </button>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      // Navigate to settings page when implemented
                    }}
                    className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 flex items-center font-poppins transition-colors duration-150"
                  >
                    <svg className="w-4 h-4 mr-2 sm:mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Pengaturan
                  </button>

                  <div className="border-t border-gray-100 dark:border-gray-700 mt-2">
                    <button
                      onClick={handleLogoutClick}
                      className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center font-poppins transition-colors duration-150"
                    >
                      <svg className="w-4 h-4 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
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
            <DialogTitle className="text-center font-poppins">
              Konfirmasi Keluar
            </DialogTitle>
            <DialogDescription className="text-center font-poppins">
              Apakah Anda yakin ingin keluar dari akun Anda? Anda akan diarahkan ke halaman login.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 sm:space-x-2">
            <button
              onClick={() => setShowLogoutModal(false)}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors duration-200 font-poppins"
            >
              Batal
            </button>
            <button
              onClick={handleLogoutConfirm}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-200 font-poppins"
            >
              Keluar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
