'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { authApi, dashboardApi } from '@/lib/api';
import BusinessProfileModal from '@/components/modals/BusinessProfileModal';
import BankAccountModal from '@/components/modals/BankAccountModal';
import AddOutletModal from '@/components/modals/AddOutletModal';
import { Button } from '@/components/ui/button';

interface DashboardStats {
  totalProducts: number;
  totalServices: number;
  totalOrders: number;
  totalRevenue: number;
}

interface Business {
  id: string;
  name: string;
  description?: string;
  type?: string;
  address?: string;
  phone?: string;
  bankName?: string;
  bankAccount?: string;
  accountHolder?: string;
  transactionFeeBearer?: string;
}

interface Outlet {
  id: string;
  name: string;
  address: string;
  phone?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalServices: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [orderStats, setOrderStats] = useState<Record<string, { totalOrders: number; totalRevenue: number }>>({});
  const [business, setBusiness] = useState<Business | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddOutletModal, setShowAddOutletModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [pendingCreateBusiness, setPendingCreateBusiness] = useState<{ name: string; description?: string; defaultTransactionFeeBearer: 'CUSTOMER' | 'OWNER' } | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          window.location.href = '/auth/login';
          return;
        }

        // Get user data, business, and outlets
        const userData = await authApi.me();
        setBusiness(userData.business);
        setOutlets(userData.outlets);

        // Set first outlet as default if no outlet is selected
        const currentOutlet = selectedOutlet || userData.outlets[0]?.id;
        if (currentOutlet && currentOutlet !== selectedOutlet) {
          setSelectedOutlet(currentOutlet);
        }

        // Fetch dashboard summary and stats for the outlet
        if (currentOutlet) {
          await Promise.all([
            fetchDashboardSummary(currentOutlet),
            fetchOrderStats(currentOutlet)
          ]);
        }
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setGlobalError(error?.message || 'Gagal memuat data dashboard');
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          localStorage.removeItem('token');
          window.location.href = '/auth/login';
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedDate]);

  const fetchDashboardSummary = async (outletId: string) => {
    try {
      const summary = await dashboardApi.getSummary(outletId);
      
      setStats({
        totalProducts: summary.totalProducts,
        totalServices: summary.totalServices,
        totalOrders: summary.totalOrders,
        totalRevenue: summary.totalRevenue,
      });
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      // Fallback to 0 values if API fails
      setStats({
        totalProducts: 0,
        totalServices: 0,
        totalOrders: 0,
        totalRevenue: 0,
      });
    }
  };

  const fetchOrderStats = async (outletId: string) => {
    try {
      const stats = await dashboardApi.getOrderStats(outletId, 'week');
      setOrderStats(stats);
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  };

  useEffect(() => {
    // Listen for outlet changes from sidebar
    const handleOutletChange = (event: CustomEvent) => {
      const newOutletId = event.detail.outletId;
      setSelectedOutlet(newOutletId);
      
      // Fetch new data for the selected outlet
      if (newOutletId) {
        fetchDashboardSummary(newOutletId);
        fetchOrderStats(newOutletId);
      }
    };

    window.addEventListener('outletChanged', handleOutletChange as EventListener);
    
    return () => {
      window.removeEventListener('outletChanged', handleOutletChange as EventListener);
    };
  }, []);

  const handleAddOutletSuccess = () => {
    // Refresh the page data
    window.location.reload();
  };

  const handleBankAccountSuccess = () => {
    // Refresh the page data
    window.location.reload();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded-lg w-48 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded-lg w-64"></div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 animate-fade-in-up">
        {globalError && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {globalError}
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
          <div className="animate-slide-in-left">
            
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 animate-slide-in-top">
            <div className="flex items-center bg-white rounded-xl sm:rounded-2xl shadow-lg px-3 sm:px-4 py-2.5 sm:py-3 border border-red-100 hover:shadow-xl transition-all duration-300 input-focus">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-none focus:outline-none text-sm font-medium text-gray-700 bg-transparent w-full"
              />
            </div>
          </div>
        </div>

        {/* Business Profile Section */}
        {business ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-red-50 card-hover animate-fade-in-up">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Profil Bisnis
              </h2>
              <div className="flex items-center gap-2">
                {business && (
                  <button
                    onClick={() => setShowBusinessModal(true)}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Edit Profil Bisnis
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              {/* Business Info */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nama Bisnis</label>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 break-words">{business.name}</p>
                </div>
                
                {business.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Deskripsi</label>
                    <p className="text-gray-700 break-words">{business.description}</p>
                  </div>
                )}
                
                {business.type && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Jenis Bisnis</label>
                    <p className="text-gray-700">{business.type}</p>
                  </div>
                )}
                
                {business.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Alamat</label>
                    <p className="text-gray-700 break-words">{business.address}</p>
                  </div>
                )}
                
                {business.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telepon</label>
                    <p className="text-gray-700">{business.phone}</p>
                  </div>
                )}
              </div>
              
              {/* Bank Info */}
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <h3 className="text-base sm:text-lg font-semibold text-green-700 flex items-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Informasi Bank
                </h3>
                
                {business.bankName && business.bankAccount ? (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div>
                          <label className="text-sm font-medium text-green-600">Nama Bank</label>
                          <p className="text-green-800 font-semibold break-words">{business.bankName}</p>
                        </div>
                        
                        <div className="mt-3">
                          <label className="text-sm font-medium text-green-600">Nomor Rekening</label>
                          <p className="text-green-800 font-mono text-base sm:text-lg break-all">{business.bankAccount}</p>
                        </div>
                        
                        {business.accountHolder && (
                          <div className="mt-3">
                            <label className="text-sm font-medium text-green-600">Nama Pemilik Rekening</label>
                            <p className="text-green-800 break-words">{business.accountHolder}</p>
                          </div>
                        )}
                        
                        {business.transactionFeeBearer && (
                          <div className="mt-3">
                            <label className="text-sm font-medium text-green-600">Penanggung Biaya Transaksi</label>
                            <p className="text-green-800">{business.transactionFeeBearer}</p>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => setShowBankModal(true)}
                        className="flex-shrink-0 p-1.5 sm:p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Edit informasi bank"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <svg className="w-12 h-12 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-green-600 font-medium">Informasi bank belum diatur</p>
                    <p className="text-green-500 text-sm mt-1">Atur rekening bank untuk menerima pembayaran</p>
                    <button 
                      onClick={() => setShowBankModal(true)}
                      className="mt-3 text-sm bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Atur Informasi Bank
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Empty Business Profile Card
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-50 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Profil Bisnis</h2>
                <p className="text-gray-600">Belum ada data profil bisnis. Lengkapi terlebih dahulu agar dapat menggunakan fitur secara penuh.</p>
                <div className="mt-4">
                  <Button onClick={() => setShowBusinessModal(true)}>Lengkapi Profil Bisnis</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-red-50 card-hover animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500">Total Produk</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-sm text-green-600 font-medium mt-1">
                  Barang & Jasa
                </p>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-gradient rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-red-50 card-hover animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500">Total Layanan</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalServices}</p>
                <p className="text-sm text-blue-600 font-medium mt-1">
                  Jasa Tersedia
                </p>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-gradient rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-red-50 card-hover animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500">Total Pesanan</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-sm text-orange-600 font-medium mt-1">
                  Hari Ini
                </p>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-gradient rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-red-50 card-hover animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500">Total Pendapatan</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-sm text-green-600 font-medium mt-1">
                  Keseluruhan
                </p>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-gradient rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Outlets Section */}
        {outlets.length > 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-red-50 card-hover animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Daftar Outlet ({outlets.length})
              </h2>
              <button 
                onClick={() => setShowAddOutletModal(true)}
                className="bg-blue-gradient text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:shadow-lg transition-all duration-300 text-sm font-medium flex items-center justify-center"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Outlet
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {outlets.map((outlet, index) => (
                <div 
                  key={outlet.id} 
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                    outlet.id === selectedOutlet 
                      ? 'border-red-500 bg-red-50 shadow-lg' 
                      : 'border-gray-200 hover:border-red-300 hover:shadow-md'
                  }`}
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {outlet.imageUrl ? (
                        <img 
                          src={outlet.imageUrl} 
                          alt={outlet.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-red-gradient rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{outlet.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{outlet.address}</p>
                      {outlet.phone && (
                        <p className="text-sm text-gray-500 mt-1">{outlet.phone}</p>
                      )}
                      
                      {outlet.id === selectedOutlet && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <svg className="w-2 h-2 mr-1 fill-current" viewBox="0 0 8 8">
                              <circle cx="4" cy="4" r="3" />
                            </svg>
                            Outlet Aktif
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-50 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Informasi Outlet</h2>
                <p className="text-gray-600">Belum ada outlet terdaftar. Tambahkan outlet untuk mulai berjualan.</p>
                <div className="mt-4">
                  <Button onClick={() => setShowAddOutletModal(true)} variant="primary">Tambah Outlet</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bank owner info empty card if business exists but no bank */}
        {business && !(business.bankName && business.bankAccount) && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Informasi Pemilik Rekening</h2>
            <p className="text-gray-600">Lengkapi informasi pemilik rekening untuk penarikan dana.</p>
            <div className="mt-4">
              <Button onClick={() => setShowBankModal(true)} variant="primary">Lengkapi Informasi Rekening</Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <BusinessProfileModal
        open={showBusinessModal}
        onOpenChange={setShowBusinessModal}
        businessId={business?.id}
        initialName={business?.name}
        initialDescription={business?.description}
        onSuccess={() => {
          // if updating, just reload; if creating, handled in onCreateRequested
          if (business?.id) {
            window.location.reload()
          }
        }}
        onCreateRequested={(data) => {
          setPendingCreateBusiness(data)
          setShowBusinessModal(false)
          setShowBankModal(true)
        }}
      />
      {/* Bank modal: update if business exists, or create if not */}
      <BankAccountModal
        open={showBankModal}
        onOpenChange={(v) => {
          setShowBankModal(v)
          if (!v) setPendingCreateBusiness(null)
        }}
        businessId={business?.id}
        createPayload={business ? undefined : pendingCreateBusiness ?? undefined}
        onSuccess={() => {
          setPendingCreateBusiness(null)
          handleBankAccountSuccess()
        }}
      />

      {/* Add Outlet modal should still be openable, but requires an existing businessId */}
      <AddOutletModal
        open={showAddOutletModal}
        onOpenChange={setShowAddOutletModal}
        businessId={business?.id || ''}
        onSuccess={handleAddOutletSuccess}
      />
    </DashboardLayout>
  );
}
