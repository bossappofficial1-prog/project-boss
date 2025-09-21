'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserData } from '@/hooks/useUserData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Outlet {
  id: string;
  name: string;
  address: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
}

interface Business {
  id: string;
  name: string;
  description?: string;
  type?: string;
  address?: string;
  phone?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  transactionFeeBearer?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);

  // Use custom hook for user data
  const {
    data: userData,
    isLoading,
    error,
    refetch
  } = useUserData();

  // Process user data when it's available
  useEffect(() => {
    if (userData) {
      // Set business data
      if (userData.business) {
        setBusiness(userData.business);
      }

      // Set outlets data
      if (userData.outlets && userData.outlets.length > 0) {
        setOutlets(userData.outlets);

        // Check if there's a previously selected outlet in localStorage
        const savedOutletId = localStorage.getItem('selectedOutlet');
        const validOutlet = userData.outlets.find((outlet: Outlet) => outlet.id === savedOutletId);

        if (validOutlet && savedOutletId) {
          setSelectedOutlet(savedOutletId);
        } else {
          // Default to first outlet
          setSelectedOutlet(userData.outlets[0].id);
          localStorage.setItem('selectedOutlet', userData.outlets[0].id);
        }
      }
    }
  }, [userData]);

  const handleOutletChange = (outletId: string) => {
    setSelectedOutlet(outletId);
    localStorage.setItem('selectedOutlet', outletId);

    // Trigger a custom event to notify other components about outlet change
    window.dispatchEvent(new CustomEvent('outletChanged', {
      detail: { outletId, outlet: outlets.find(o => o.id === outletId) }
    }));
  };

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/owner/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h2a2 2 0 012 2v2H8V5z" />
        </svg>
      ),
    },
    {
      name: 'Produk dan Layanan',
      href: '/owner/dashboard/products',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      name: 'Stok Produk',
      href: '/owner/dashboard/stock',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H5zm0 0v8a2 2 0 002 2h8a2 2 0 002-2V8m-6 4h4" />
        </svg>
      ),
    },
    {
      name: 'Jasa',
      href: '/owner/dashboard/services',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
    {
      name: 'Pesanan',
      href: '/owner/dashboard/orders',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      name: 'Antrian',
      href: '/owner/dashboard/queue',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Laporan',
      href: '/owner/dashboard/reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Pengeluaran',
      href: '/owner/dashboard/expenses',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      ),
    },
    {
      name: 'Riwayat Transaksi',
      href: '/owner/dashboard/transactions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      name: 'Penarikan Dana',
      href: '/owner/dashboard/withdrawals',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-64 bg-gradient-to-b from-red-700 to-red-900 dark:from-gray-800 dark:to-gray-900 shadow-2xl transform transition-transform duration-300 ease-out lg:translate-x-0 lg:z-auto
        ${isOpen ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-full opacity-0 scale-95'}
        lg:opacity-100 lg:scale-100
        `}
        style={{ willChange: 'transform, opacity' }}
      >
        {/* Sidebar container is fixed and full-height */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo */}
          <div className="flex items-center justify-center py-8 px-4 border-b border-red-500/30 dark:border-gray-700">
            <Image
              src="/Logo Boss Putih.png"
              alt="BOSS Logo"
              width={150}
              height={150}
              className="object-contain"
            />
          </div>

          {/* Outlet Selector */}
          <div className="px-4 py-6 border-b border-red-500/30 dark:border-gray-700">
            <label className="flex items-center text-sm font-semibold text-red-100 dark:text-gray-300 mb-3 font-poppins">
              Pilih Outlet
              {outlets.length > 0 && (
                <span className="ml-2 bg-white/20 text-xs px-2 py-1 rounded-full">
                  {outlets.length}
                </span>
              )}
            </label>

            {isLoading ? (
              <div className="w-full px-4 py-3 border-0 rounded-xl shadow-lg bg-white/10 dark:bg-gray-700/50 backdrop-blur-sm text-white dark:text-gray-200 text-sm font-medium font-poppins flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Memuat outlet...
              </div>
            ) : error ? (
              <div className="w-full px-4 py-3 border-0 rounded-xl shadow-lg bg-red-500/20 backdrop-blur-sm text-red-100 text-sm font-medium font-poppins flex items-center justify-between">
                <span>Gagal memuat outlet</span>
                <button
                  onClick={() => refetch()}
                  className="text-red-200 hover:text-white text-xs underline"
                >
                  Coba lagi
                </button>
              </div>
            ) : (
              <Select value={selectedOutlet} onValueChange={handleOutletChange}>
                <SelectTrigger className="w-full px-4 py-3 border-0 rounded-xl shadow-lg bg-white/10 dark:bg-gray-700/50 backdrop-blur-sm text-white dark:text-gray-200 placeholder-red-200 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-gray-500 focus:bg-white/20 dark:focus:bg-gray-600/50 text-sm font-medium font-poppins transition-all duration-200">
                  <SelectValue placeholder="Pilih outlet" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  {outlets.length === 0 ? (
                    <SelectItem value="" disabled>
                      Belum ada outlet
                    </SelectItem>
                  ) : (
                    outlets.map((outlet) => (
                      <SelectItem key={outlet.id} value={outlet.id} className="text-gray-900 dark:text-gray-100">
                        {outlet.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 font-poppins relative overflow-hidden ${isActive
                    ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-lg transform scale-105'
                    : 'text-red-100 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-gray-700/50 hover:text-white dark:hover:text-white hover:transform hover:scale-102'
                    }`}
                  onClick={() => {
                    localStorage.setItem('selectedOutlet', selectedOutlet);
                    onClose();
                  }}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 h-full w-1 bg-red-600 rounded-r-full"></div>
                  )}

                  <span className={`mr-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-red-600 dark:text-red-400' : 'text-red-200 dark:text-gray-400'
                    }`}>
                    {item.icon}
                  </span>

                  <span className="flex-1">{item.name}</span>

                  {/* Hover arrow */}
                  <svg
                    className={`w-4 h-4 transition-all duration-200 ${isActive ? 'opacity-100 text-red-600' : 'opacity-0 group-hover:opacity-100 text-red-200'
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-6 border-t border-red-500/30">
            <div className="flex items-center justify-center space-x-2 text-red-200 bg-white/5 rounded-xl p-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-xs font-medium font-poppins">
                BOSS Dashboard v1.0.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
