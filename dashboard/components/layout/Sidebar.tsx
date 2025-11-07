'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserData } from '@/hooks/useUserData';
import { useOutletContext } from '@/components/providers/OutletProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Store,
  Package,
  Box,
  Wrench,
  ShoppingBag,
  Clock,
  FileText,
  TrendingDown,
  Receipt,
  Banknote,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Outlet } from '@/types';
import { cn } from '@/lib/utils';

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

interface MenuItem {
  name: string;
  href?: string;
  icon: React.ReactNode;
  isDropdown?: boolean;
  subItems?: { name: string; href: string; badge?: string }[];
  badge?: string;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  // Get outlet context with safety check
  let selectedOutlet: Outlet | null = null;
  let outlets: Outlet[] = [];
  let outletLoading = true;
  let setSelectedOutlet: (outlet: Outlet | null) => void = () => {
    console.warn('setSelectedOutlet fallback called - OutletContext not available');
  };

  try {
    const outletContext = useOutletContext();
    selectedOutlet = outletContext.selectedOutlet;
    outlets = outletContext.outlets;
    outletLoading = outletContext.isLoading;
    setSelectedOutlet = outletContext.setSelectedOutlet;
  } catch (error) {
    if (typeof window !== 'undefined') {
      const oldSavedOutlet = localStorage.getItem('selectedOutletId');
      if (oldSavedOutlet) {
        try {
          const parsed = JSON.parse(oldSavedOutlet);
          if (parsed && parsed.id) {
            selectedOutlet = parsed;
            outlets = [parsed];
            localStorage.setItem('selectedOutlet', parsed.id);
            localStorage.removeItem('selectedOutletId');
          }
        } catch (parseError) {
          if (oldSavedOutlet) {
            localStorage.setItem('selectedOutlet', oldSavedOutlet);
            localStorage.removeItem('selectedOutletId');
          }
        }
      }
    }
  }

  const [business, setBusiness] = useState<Business | null>(null);

  // Use custom hook for user data
  const {
    data: userData,
    isLoading,
    error,
    refetch
  } = useUserData();

  useEffect(() => {
    if (userData?.business) {
      setBusiness(userData.business);
    }
  }, [userData]);

  // Auto-expand menu if a sub-item is active
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.isDropdown && item.subItems) {
        const hasActiveSubItem = item.subItems.some(subItem => pathname === subItem.href);
        if (hasActiveSubItem && !expandedMenus[item.name]) {
          setExpandedMenus(prev => ({ ...prev, [item.name]: true }));
        }
      }
    });
  }, [pathname]);

  const handleOutletChange = (outletId: string) => {
    const outlet = outlets.find(o => o.id === outletId);
    if (outlet && setSelectedOutlet && typeof setSelectedOutlet === 'function') {
      setSelectedOutlet(outlet);
      // Close sidebar on mobile after selection
      if (window.innerWidth < 1024) {
        onClose();
      }
    }
  };

  const menuItems: MenuItem[] = useMemo(() => [
    {
      name: 'Dashboard',
      href: '/owner/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: 'Outlet',
      isDropdown: true,
      icon: <Store className="w-5 h-5" />,
      subItems: [
        { name: 'Dashboard Outlet', href: '/owner/dashboard/outlets' },
        { name: 'Kelola Outlet', href: '/owner/dashboard/outlets/manage' }
      ]
    },
    {
      name: 'Produk dan Layanan',
      href: '/owner/dashboard/products',
      icon: <Package className="w-5 h-5" />,
    },
    {
      name: 'Stok Produk',
      href: '/owner/dashboard/stock',
      icon: <Box className="w-5 h-5" />,
    },
    {
      name: 'Jasa',
      href: '/owner/dashboard/services',
      icon: <Wrench className="w-5 h-5" />,
    },
    {
      name: 'POS',
      href: '/owner/dashboard/pos/orders',
      icon: <ShoppingBag className="w-5 h-5" />
    },
    {
      name: 'Lihat Pesanan',
      isDropdown: false,
      href: '/owner/dashboard/orders',
      icon: <ShoppingBag className="w-5 h-5" />,
    },
    {
      name: 'Lihat Antrian',
      isDropdown: false,
      icon: <Clock className="w-5 h-5" />,
      href: '/owner/dashboard/queue',
      // subItems: [
      //   { name: 'Lihat Antrian', href: '/owner/dashboard/queue' },
      //   { name: 'Tambah Antrian Baru', href: '/owner/dashboard/pos/queue' }
      // ]
    },
    {
      name: 'Laporan',
      href: '/owner/dashboard/reports',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      name: 'Pengeluaran',
      href: '/owner/dashboard/expenses',
      icon: <TrendingDown className="w-5 h-5" />,
    },
    {
      name: 'Riwayat Transaksi',
      href: '/owner/dashboard/transactions',
      icon: <Receipt className="w-5 h-5" />,
    },
    {
      name: 'Penarikan Dana',
      href: '/owner/dashboard/withdrawals',
      icon: <Banknote className="w-5 h-5" />,
    },
  ], []);

  const renderOutletSelector = () => {
    if (isLoading || outletLoading) {
      return (
        <div className="w-full px-4 py-3 border-0 rounded-xl shadow-sm bg-white/10 dark:bg-red-900/40 backdrop-blur-sm text-white dark:text-white text-sm font-medium flex items-center">
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          <span>Memuat outlet...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full px-4 py-3 border-0 rounded-xl shadow-sm bg-red-500/20 dark:bg-red-900/50 backdrop-blur-sm text-red-100 dark:text-red-100 text-sm font-medium">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span>Gagal memuat</span>
            </div>
            <Button
              onClick={() => refetch()}
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-red-200 hover:text-white hover:bg-red-500/30 dark:hover:bg-red-800/50"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Select value={selectedOutlet?.id || ""} onValueChange={handleOutletChange}>
        <SelectTrigger className="w-full px-4 py-3 border-0 rounded-xl shadow-sm bg-white/10 dark:bg-red-900/40 backdrop-blur-sm text-white dark:text-white placeholder:text-red-200 dark:placeholder:text-red-200 focus:outline-none focus:ring-2 focus:ring-white/30 dark:focus:ring-red-300/50 hover:bg-white/15 dark:hover:bg-red-900/50 text-sm font-medium transition-all duration-200">
          <SelectValue placeholder="Pilih outlet" />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-red-950 border-gray-200 dark:border-red-800">
          {outlets.length === 0 ? (
            <SelectItem value="outlet_not_found" disabled>
              Belum ada outlet
            </SelectItem>
          ) : (
            outlets.map((outlet) => (
              <SelectItem
                key={outlet.id}
                value={outlet.id}
                className="text-gray-900 dark:text-red-50 cursor-pointer dark:focus:bg-red-900/50"
              >
                {outlet.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    );
  };

  const renderMenuItem = (item: MenuItem, index: number) => {
    if (item.isDropdown && item.subItems) {
      const isExpanded = expandedMenus[item.name];
      const hasActiveSubItem = item.subItems.some(subItem => pathname === subItem.href);

      return (
        <div key={item.name} className="space-y-1">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => toggleMenu(item.name)}
                  className={cn(
                    "group w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative",
                    hasActiveSubItem || isExpanded
                      ? 'bg-white/15 dark:bg-red-800/50 text-white shadow-sm'
                      : 'text-red-100 dark:text-red-100 hover:bg-white/10 dark:hover:bg-red-800/30 hover:text-white'
                  )}
                >
                  <div className="flex items-center min-w-0 flex-1">
                    <span className={cn(
                      "mr-3 transition-all duration-200 flex-shrink-0",
                      hasActiveSubItem || isExpanded
                        ? 'text-white scale-110'
                        : 'text-red-200 dark:text-red-200 group-hover:scale-110'
                    )}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.name}</span>
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform duration-200 flex-shrink-0 ml-2",
                    isExpanded && 'rotate-90',
                    hasActiveSubItem || isExpanded
                      ? 'text-white'
                      : 'text-red-200 dark:text-red-200'
                  )} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                <p>{item.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className={cn(
            "ml-4 pl-4 border-l-2 border-white/20 dark:border-red-400/30 space-y-1 overflow-hidden transition-all duration-300",
            isExpanded ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
          )}>
            {item.subItems.map((subItem) => {
              const isActive = pathname === subItem.href;
              return (
                <Link
                  key={subItem.href}
                  href={subItem.href}
                  onClick={onClose}
                  className={cn(
                    "block px-4 py-2.5 text-sm rounded-lg transition-all duration-200 relative group",
                    isActive
                      ? 'bg-white dark:bg-red-700/60 text-red-600 dark:text-white font-medium shadow-sm'
                      : 'text-red-100 dark:text-red-100 hover:bg-white/10 dark:hover:bg-red-800/30 hover:text-white hover:pl-5'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-red-600 dark:bg-red-300 rounded-r-full" />
                  )}
                  <span className="flex items-center justify-between">
                    <span>{subItem.name}</span>
                    {subItem.badge && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {subItem.badge}
                      </Badge>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      );
    }

    const isActive = pathname === item.href;
    return (
      <TooltipProvider key={item.name} delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={item.href!}
              onClick={onClose}
              className={cn(
                "group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative",
                isActive
                  ? 'bg-white dark:bg-red-700/60 text-red-600 dark:text-white shadow-md'
                  : 'text-red-100 dark:text-red-100 hover:bg-white/10 dark:hover:bg-red-800/30 hover:text-white'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-red-600 dark:bg-red-300 rounded-r-full" />
              )}
              <span className={cn(
                "mr-3 transition-all duration-200",
                isActive
                  ? 'text-red-600 dark:text-white scale-110'
                  : 'text-red-200 dark:text-red-200 group-hover:scale-110'
              )}>
                {item.icon}
              </span>
              <span className="flex-1 truncate">{item.name}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {item.badge}
                </Badge>
              )}
              <ChevronRight className={cn(
                "w-4 h-4 transition-all duration-200 ml-2",
                isActive
                  ? 'opacity-100 text-red-600 dark:text-white'
                  : 'opacity-0 group-hover:opacity-100 text-red-200'
              )} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="lg:hidden">
            <p>{item.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 bg-gradient-to-b from-red-700 to-red-900 dark:from-red-800 dark:to-red-950 shadow-2xl transform transition-all duration-300 ease-out lg:translate-x-0",
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Sidebar Navigation"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo */}
          <div className="flex items-center justify-center py-6 px-4 border-b border-red-500/20 dark:border-red-400/20">
            <Image
              src="/Logo Boss Putih.png"
              alt="BOSS Logo"
              width={140}
              height={140}
              className="object-contain"
              priority
            />
          </div>

          {/* Outlet Selector */}
          <div className="px-4 py-4 border-b border-red-500/20 dark:border-red-400/20">
            <label className="flex items-center justify-between text-xs font-semibold text-red-100 dark:text-red-100 mb-2 uppercase tracking-wide">
              <span>Pilih Outlet</span>
              {outlets.length > 0 && (
                <Badge variant="secondary" className="bg-white/20 text-white text-xs px-2 py-0.5">
                  {outlets.length}
                </Badge>
              )}
            </label>
            {renderOutletSelector()}
          </div>

          {/* Navigation Menu */}
          <nav
            className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30"
            aria-label="Main Navigation"
          >
            {menuItems.map((item, index) => renderMenuItem(item, index))}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-red-500/20 dark:border-red-400/20">
            <div className="flex items-center justify-center space-x-2 text-red-100 dark:text-red-100 bg-white/5 dark:bg-red-900/30 rounded-xl p-3 hover:bg-white/10 dark:hover:bg-red-900/40 transition-colors duration-200">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-medium">
                BOSS Dashboard v1.0
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .scrollbar-thin:hover::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </>
  );
}