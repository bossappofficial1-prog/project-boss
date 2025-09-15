'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { stockApi, authApi, productApi } from '@/lib/api';
import UpdateStockModal from '@/components/modals/UpdateStockModal';

interface StockItem {
  id: string;
  name: string;
  type: 'GOODS' | 'SERVICE';
  quantity?: number;
  unit?: string;
  price: number;
  status: 'ACTIVE' | 'INACTIVE';
  image?: string;
}

interface Outlet {
  id: string;
  name: string;
  address: string;
}

export default function StockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  // We always show GOODS only on this page
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StockItem | null>(null);
  const [hasBusinessProfile, setHasBusinessProfile] = useState<boolean>(false);
  const [hasOutlet, setHasOutlet] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
  const userData = await authApi.me();
        setOutlets(userData.outlets);
  const hasBusiness = !!userData.business?.id;
  const hasBank = !!(userData.business?.bankName && userData.business?.accountNumber);
  setHasBusinessProfile(hasBusiness && hasBank);
  setHasOutlet(userData.outlets.length > 0);
        // Avoid indefinite loading when there are no outlets yet
        if (userData.outlets.length === 0) {
          setIsLoading(false);
        }
        if (userData.outlets.length > 0) {
          const savedOutletId = typeof window !== 'undefined' ? localStorage.getItem('selectedOutlet') : null;
          const validSaved = savedOutletId && userData.outlets.find((o: Outlet) => o.id === savedOutletId);
          if (validSaved && savedOutletId) {
            setSelectedOutlet(savedOutletId);
          } else {
            const firstOutletId = userData.outlets[0].id;
            setSelectedOutlet(firstOutletId);
            if (!savedOutletId) localStorage.setItem('selectedOutlet', firstOutletId);
          }
        }
      } catch (error) {
        setError('Error mengambil data user. Silakan coba lagi.');
        console.error('Error fetching user data:', error);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (selectedOutlet) {
      fetchStockData();
    }
  }, [selectedOutlet]);

  useEffect(() => {
    // Listen for outlet changes from sidebar
    const handleOutletChange = (event: CustomEvent) => {
      const newOutletId = event.detail.outletId;
      setSelectedOutlet(newOutletId);
    };

    window.addEventListener('outletChanged', handleOutletChange as EventListener);
    
    return () => {
      window.removeEventListener('outletChanged', handleOutletChange as EventListener);
    };
  }, []);

  const fetchStockData = async () => {
    if (!selectedOutlet) return;
    
    try {
      setIsLoading(true);
      const filters: any = { type: 'GOODS' }; // Always filter to GOODS only
      
      if (searchQuery) filters.search = searchQuery;
      if (statusFilter !== 'ALL') filters.status = statusFilter;

      const data = await stockApi.getByOutlet(selectedOutlet, filters);
      setStockItems(data);
    } catch (error) {
      setError('Error mengambil data stok. Silakan coba lagi.');
      console.error('Error fetching stock data:', error);
      setStockItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchStockData();
  };

  const handleExportStock = async () => {
    if (!selectedOutlet) return;

    try {
      const blob = await productApi.exportData(selectedOutlet, {
        type: 'GOODS',
        search: searchQuery || undefined,
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data_stok_produk_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setError('Gagal mengekspor data stok. Silakan coba lagi.');
      console.error('Error exporting stock:', error);
    }
  };

  const handleUpdateStock = (product: StockItem) => {
    if (product.type === 'GOODS') {
      setSelectedProduct(product);
      setShowUpdateModal(true);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatus = (quantity?: number) => {
    if (!quantity) return 'Habis';
    if (quantity <= 5) return 'Rendah';
    if (quantity <= 20) return 'Sedang';
    return 'Tinggi';
  };

  const getStockStatusColor = (quantity?: number) => {
    if (!quantity) return 'bg-red-100 text-red-800';
    if (quantity <= 5) return 'bg-yellow-100 text-yellow-800';
    if (quantity <= 20) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  // Filter stock items based on search and filters (only GOODS)
  const filteredStockItems = stockItems.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const isGoods = item.type === 'GOODS'; // Only show GOODS
    
    return matchesSearch && matchesStatus && isGoods;
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg w-48 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border dark:border-gray-700">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Guidance screen when business profile/bank or outlets are not ready
  if (!isLoading && !hasBusinessProfile && !hasOutlet) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto mt-10">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 border border-amber-100 dark:border-amber-800/50">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10A8 8 0 11.001 10 8 8 0 0118 10zm-8-4a1 1 0 00-.993.883L9 7v3a1 1 0 00.883.993L10 11h.01a1 1 0 01.117 1.993L10 13H9a1 1 0 00-.117 1.993L9 15h2a1 1 0 00.117-1.993L11 13h-.01a1 1 0 01-.117-1.993L11 11h-1V7a1 1 0 00-1-1zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Lengkapi Profil Bisnis & Tambahkan Outlet</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Untuk mengelola stok produk, Anda perlu:</p>
                <ul className="mt-3 space-y-2 text-gray-700 dark:text-gray-300 list-disc pl-5">
                  <li>Lengkapi profil bisnis beserta informasi rekening</li>
                  <li>Tambah minimal satu outlet</li>
                </ul>
                <div className="mt-6">
                  <button
                    onClick={() => (window.location.href = '/dashboard')}
                    className="inline-flex items-center px-5 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Oke, ke Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Stok Produk</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Monitor dan kelola stok untuk outlet {outlets.find(o => o.id === selectedOutlet)?.name}
            </p>
          </div>
          <div className="mt-4 lg:mt-0">
            <button
              onClick={handleExportStock}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Data
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error</h3>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

  {/* Filters and Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Tidak Aktif</option>
            </select>
          </div>

          {/* Search Button */}
          <div>
            <button
              onClick={handleSearch}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-gradient text-white rounded-lg hover:shadow-lg transition-all duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">Cari</span>
              <span className="sm:hidden">Search</span>
            </button>
          </div>
        </div>

        {/* Mobile list (cards) */}
        <div className="sm:hidden space-y-3">
          {filteredStockItems.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/20 p-4 flex gap-3 border dark:border-gray-700">
              <img
                src={item.image || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
                alt={item.name}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{item.name}</div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="text-gray-600 dark:text-gray-400">{formatCurrency(item.price)}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${getStockStatusColor(item.quantity)}`}>{getStockStatus(item.quantity)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                  <div>Stok: {item.quantity || 0} {item.unit || 'pcs'}</div>
                  <button
                    onClick={() => handleUpdateStock(item)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Update Stok
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredStockItems.length === 0 && !isLoading && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow dark:shadow-gray-900/20 border dark:border-gray-700">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Tidak ada data stok</h3>
              <p className="text-gray-500 dark:text-gray-400">Belum ada produk yang ditemukan.</p>
            </div>
          )}
        </div>

        {/* Stock Table (desktop) */}
        <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border dark:border-gray-700">
          {/* Mobile scroll hint */}
          <div className="sm:hidden px-4 py-2 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Tabel Stok</span>
              <span className="text-xs text-gray-400 animate-pulse flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 15.707a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0-1.414-1.414L11 13.586V3a1 1 0 1 0-2 0v10.586l-3.293-3.293a1 1 0 0 0-1.414 1.414l4 4z" clipRule="evenodd" transform="rotate(270 10 10)" />
                </svg>
                Geser kanan
              </span>
            </div>
          </div>
          
          {/* Table container with proper scroll behavior */}
          <div className="overflow-x-auto max-w-full">
            <div className="min-w-full inline-block align-middle">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="w-14 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    No
                  </th>
                  <th className="w-24 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                    Gambar
                  </th>
                  <th className="w-56 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nama Produk
                  </th>
                  <th className="w-20 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stok
                  </th>
                  <th className="w-20 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                    Satuan
                  </th>
                  <th className="w-28 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    Harga Jual
                  </th>
                  <th className="w-28 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                    Status
                  </th>
                  <th className="w-28 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStockItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {index + 1}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex-shrink-0 h-12 w-12">
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={item.image || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
                          alt={item.name}
                        />
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center sm:block">
                        {/* Mobile: Show image inline */}
                        <div className="flex-shrink-0 h-10 w-10 mr-3 sm:hidden">
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={item.image || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
                            alt={item.name}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                            {item.name}
                          </div>
                          {/* Mobile: Show status */}
                          <div className="mt-1 sm:hidden flex flex-wrap gap-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                            </span>
                          </div>
                          {/* Mobile: Show price */}
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 md:hidden">
                            {formatCurrency(item.price)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="text-sm text-gray-900 dark:text-gray-100 sm:mr-2">
                          {item.quantity || 0}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 sm:mt-0 ${getStockStatusColor(item.quantity)}`}>
                          {getStockStatus(item.quantity)}
                        </span>
                        {/* Mobile: Show unit */}
                        <span className="text-xs text-gray-500 dark:text-gray-400 lg:hidden">
                          {item.unit || 'pcs'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 hidden lg:table-cell">
                      {item.unit || 'pcs'}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 hidden md:table-cell">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleUpdateStock(item)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center text-xs sm:text-sm"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="hidden sm:inline">Update Stok</span>
                        <span className="sm:hidden">Update</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>

          {filteredStockItems.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data stok</h3>
              <p className="text-gray-500">Belum ada produk yang ditemukan sesuai filter yang dipilih.</p>
            </div>
          )}
        </div>
      </div>

      {/* Update Stock Modal */}
      <UpdateStockModal
        open={showUpdateModal}
        onOpenChange={setShowUpdateModal}
        product={selectedProduct}
        onUpdated={fetchStockData}
      />
    </DashboardLayout>
  );
}
