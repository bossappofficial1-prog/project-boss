'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { productApi, authApi } from '@/lib/api';
import AddProductServiceModal from '@/components/modals/AddProductServiceModal';
import ImportDataModal from '@/components/modals/ImportDataModal';
import EditProductServiceModal from '@/components/modals/EditProductServiceModal';

interface Product {
  id: string;
  name: string;
  description?: string;
  costPrice: number;
  price: number;
  type: 'GOODS' | 'SERVICE';
  quantity?: number;
  unit?: string;
  status: 'ACTIVE' | 'INACTIVE';
  serviceDurationMinutes?: number;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

interface Outlet {
  id: string;
  name: string;
  address: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [hasBusinessProfile, setHasBusinessProfile] = useState<boolean>(false);
  const [hasOutlet, setHasOutlet] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
  const userData = await authApi.me();
        setOutlets(userData.outlets);
  // Determine readiness flags
  const hasBusiness = !!userData.business?.id;
  const hasBank = !!(userData.business?.bankName && userData.business?.accountNumber);
  setHasBusinessProfile(hasBusiness && hasBank);
  setHasOutlet(userData.outlets.length > 0);
  // If there is no outlet, avoid being stuck in loading state (show UI with disabled actions)
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
        console.error('Error fetching user data:', error);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (selectedOutlet) {
      fetchProducts();
    }
  }, [selectedOutlet, currentPage, itemsPerPage, searchQuery]);

  useEffect(() => {
    // Listen for outlet changes from sidebar
    const handleOutletChange = (event: CustomEvent) => {
      const newOutletId = event.detail.outletId;
      setSelectedOutlet(newOutletId);
      setCurrentPage(1); // Reset to first page when changing outlet
    };

    window.addEventListener('outletChanged', handleOutletChange as EventListener);
    
    return () => {
      window.removeEventListener('outletChanged', handleOutletChange as EventListener);
    };
  }, []);

  const fetchProducts = async () => {
    if (!selectedOutlet) return;
    
    try {
      setIsLoading(true);
      const response = await productApi.getByOutlet(selectedOutlet, {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
      });

      if (response.products) {
        setProducts(response.products);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setTotalProducts(response.pagination.total);
        }
      } else {
        // Fallback for direct array response
        setProducts(response as any);
        setTotalPages(1);
        setTotalProducts((response as any).length);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;

    try {
      await productApi.delete(productId);
      await fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      setError(error?.message || 'Gagal menghapus produk. Silakan coba lagi.');
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await productApi.update(product.id, { status: newStatus });
      await fetchProducts();
    } catch (error: any) {
      console.error('Error updating product status:', error);
      setError(error?.message || 'Gagal mengubah status produk. Silakan coba lagi.');
    }
  };

  const handleExportProducts = async () => {
    if (!selectedOutlet) return;

    try {
      const blob = await productApi.exportData(selectedOutlet, {
        search: searchQuery || undefined,
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data_produk_dan_jasa_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error exporting products:', error);
      setError(error?.message || 'Gagal mengekspor data produk. Silakan coba lagi.');
    }
  };

  const handleRefreshData = () => {
    fetchProducts();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;
  };

  if (isLoading && products.length === 0) {
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
            <div className="bg-white rounded-lg p-6">
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

  // Guidance screen when BOTH business profile and outlets are missing
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
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Lengkapi Profil Bisnis & Tambahkan Outlet</h2>
                <p className="text-gray-600 mt-1">Untuk mulai menambah Produk dan Jasa, Anda perlu:</p>
                <ul className="mt-3 space-y-2 text-gray-700 list-disc pl-5">
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Kelola Produk</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Kelola produk dan jasa untuk outlet {outlets.find(o => o.id === selectedOutlet)?.name}
            </p>
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

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:border-red-400"
              />
            </div>
          </div>

          {/* Items per page */}
          <div>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:border-red-400"
            >
              <option value={10}>10 per halaman</option>
              <option value={15}>15 per halaman</option>
              <option value={25}>25 per halaman</option>
              <option value={50}>50 per halaman</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={handleRefreshData}
              className="flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex-1 justify-center lg:flex-initial lg:justify-start"
              title="Refresh Data"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="ml-2 hidden lg:inline">Refresh</span>
            </button>
          </div>
        </div>

  {/* No inline callout; full-page guidance covers the not-ready case when both missing */}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => hasOutlet && setShowAddModal(true)}
            disabled={!hasOutlet}
            className={`flex items-center justify-center px-6 py-3 rounded-lg transition-all duration-300 ${hasOutlet ? 'bg-red-gradient text-white hover:shadow-lg' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Tambah Produk
          </button>

          <button
            onClick={() => hasOutlet && setShowImportModal(true)}
            disabled={!hasOutlet}
            className={`flex items-center justify-center px-6 py-3 rounded-lg transition-all duration-300 ${hasOutlet ? 'bg-green-gradient text-white hover:shadow-lg' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Import Data
          </button>

          <button
            onClick={handleExportProducts}
            className="flex items-center justify-center px-6 py-3 bg-blue-gradient text-white rounded-lg hover:shadow-lg transition-all duration-300"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Data
          </button>
        </div>

        {/* Mobile list (cards) */}
        <div className="sm:hidden space-y-3">
          {products.map((product) => (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/20 p-4 flex gap-3 border dark:border-gray-700">
              <img
                src={product.image || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
                alt={product.name}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-gray-900 line-clamp-2">{product.name}</div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    product.type === 'GOODS' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {product.type === 'GOODS' ? 'Barang' : 'Jasa'}
                  </span>
                </div>
                {product.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{product.description}</div>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(product.price)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Modal: {formatCurrency(product.costPrice)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Hapus"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggleStatus(product)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                        product.status === 'ACTIVE' ? 'bg-red-600' : 'bg-gray-200'
                      }`}
                      title="Aktif/Non-aktif"
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          product.status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && !isLoading && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow dark:shadow-gray-900/20 border dark:border-gray-700">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada produk</h3>
              <p className="text-gray-500">Belum ada produk untuk outlet ini.</p>
            </div>
          )}
        </div>

        {/* Products Table (desktop) */}
        <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border dark:border-gray-700">
          {/* Mobile scroll hint */}
          <div className="sm:hidden px-4 py-2 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Tabel Produk</span>
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
                  <th className="w-48 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Produk
                  </th>
                  <th className="w-24 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                    Tipe
                  </th>
                  <th className="w-28 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    Harga Modal
                  </th>
                  <th className="w-32 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Harga Jual
                  </th>
                  <th className="w-32 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                    Stok/Durasi
                  </th>
                  <th className="w-28 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                    Status
                  </th>
                  <th className="w-28 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    Aktif/Non-aktif
                  </th>
                  <th className="w-24 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12">
                          <img
                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover"
                            src={product.image || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
                            alt={product.name}
                          />
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                            {product.name}
                          </div>
                          {product.description && (
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate max-w-[120px] sm:max-w-xs">
                              {product.description}
                            </div>
                          )}
                          {/* Show type and status on mobile */}
                          <div className="mt-1 sm:hidden flex flex-wrap gap-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              product.type === 'GOODS' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {product.type === 'GOODS' ? 'Barang' : 'Jasa'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              product.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.type === 'GOODS' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {product.type === 'GOODS' ? 'Barang' : 'Jasa'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 hidden md:table-cell">
                      {formatCurrency(product.costPrice)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <div>
                        <div className="font-medium">{formatCurrency(product.price)}</div>
                        {/* Show cost price on mobile */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 md:hidden">
                          Modal: {formatCurrency(product.costPrice)}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 hidden lg:table-cell">
                      {product.type === 'GOODS' 
                        ? `${product.quantity || 0} ${product.unit || 'pcs'}`
                        : formatDuration(product.serviceDurationMinutes)
                      }
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                          product.status === 'ACTIVE' ? 'bg-red-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            product.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        {/* Toggle status on mobile */}
                        <button
                          onClick={() => handleToggleStatus(product)}
                          className={`md:hidden relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                            product.status === 'ACTIVE' ? 'bg-red-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              product.status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Menampilkan{' '}
                    <span className="font-medium">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>{' '}
                    sampai{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, totalProducts)}
                    </span>{' '}
                    dari{' '}
                    <span className="font-medium">{totalProducts}</span> produk
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = i + Math.max(1, currentPage - 2);
                      if (pageNum > totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-red-50 border-red-500 text-red-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {products.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada produk</h3>
              <p className="text-gray-500 mb-4">Belum ada produk yang ditambahkan untuk outlet ini.</p>
              <button
                onClick={() => hasOutlet && setShowAddModal(true)}
                disabled={!hasOutlet}
                className={`inline-flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${hasOutlet ? 'bg-red-gradient text-white hover:shadow-lg' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Produk Pertama
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Modals */}
      <AddProductServiceModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        outletId={selectedOutlet || null}
        onSuccess={fetchProducts}
      />
      <EditProductServiceModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        item={selectedProduct as any}
        onSuccess={fetchProducts}
      />
      <ImportDataModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        outletId={selectedOutlet || null}
        onImported={fetchProducts}
      />
    </DashboardLayout>
  );
}
