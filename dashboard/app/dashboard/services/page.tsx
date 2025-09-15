'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { productApi, authApi } from '@/lib/api';
import EditProductServiceModal from '@/components/modals/EditProductServiceModal';

interface Service {
  id: string;
  name: string;
  description?: string;
  costPrice: number;
  price: number;
  type: 'GOODS' | 'SERVICE';
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

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [hasBusinessProfile, setHasBusinessProfile] = useState<boolean>(false);
  const [hasOutlet, setHasOutlet] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
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
  // Avoid skeleton-only state when no outlets
  if (userData.outlets.length === 0) {
    setIsLoading(false);
  }
        if (userData.outlets.length > 0) {
          // Try restore persisted outlet selection
          const savedOutletId = typeof window !== 'undefined' ? localStorage.getItem('selectedOutlet') : null;
          const validSaved = savedOutletId && userData.outlets.find((o: Outlet) => o.id === savedOutletId);
          if (validSaved && savedOutletId) {
            setSelectedOutlet(savedOutletId);
          } else {
            const firstOutletId = userData.outlets[0].id;
            setSelectedOutlet(firstOutletId);
            // Don't overwrite existing saved value if already set elsewhere
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
      fetchServices();
    }
  }, [selectedOutlet, searchQuery, statusFilter]);

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

  const fetchServices = async () => {
    if (!selectedOutlet) return;
    
    try {
      setIsLoading(true);
      const filters: any = { type: 'SERVICE' }; // Only fetch services
      
      if (searchQuery) filters.search = searchQuery;
      if (statusFilter !== 'ALL') filters.status = statusFilter;

      const data = await productApi.getByOutlet(selectedOutlet, {
        search: searchQuery || undefined,
      });

      // Filter to only services
      const serviceData = Array.isArray(data) ? data.filter(item => item.type === 'SERVICE') : 
        (data.products || []).filter((item: any) => item.type === 'SERVICE');
      
      setServices(serviceData);
    } catch (error) {
      setError('Error mengambil data jasa. Silakan coba lagi.');
      console.error('Error fetching services:', error);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchServices();
  };

  const handleExportServices = async () => {
    if (!selectedOutlet) return;

    try {
      const blob = await productApi.exportData(selectedOutlet, {
        type: 'SERVICE',
        search: searchQuery || undefined,
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data_jasa_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      setError('Gagal mengekspor data jasa. Silakan coba lagi.');
      console.error('Error exporting services:', error);
    }
  };

  const openEdit = (service: Service) => {
    setSelectedService(service);
    setShowEditModal(true);
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

  // Filter services based on search and status
  const filteredServices = services.filter(service => {
    const matchesSearch = !searchQuery || 
      service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || service.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg w-48 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {[...Array(3)].map((_, i) => (
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

  // Guidance screen when BOTH business profile and outlet are missing
  if (!isLoading && !hasBusinessProfile && !hasOutlet) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto mt-10">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-amber-100">
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
            <h1 className="text-3xl font-bold text-gray-900">Kelola Jasa</h1>
            <p className="text-gray-600 mt-1">
              Kelola layanan jasa untuk outlet {outlets.find(o => o.id === selectedOutlet)?.name}
            </p>
          </div>
          <div className="mt-4 lg:mt-0">
            <button
              onClick={handleExportServices}
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* No inline callout; full-page guidance covers the not-ready (both missing) case */}

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
                placeholder="Cari jasa..."
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
          {filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-xl shadow p-4 flex gap-3">
              <img
                src={service.image || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
                alt={service.name}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-gray-900 line-clamp-2">{service.name}</div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    service.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {service.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>
                {service.description && (
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{service.description}</div>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    <div className="font-medium">{formatCurrency(service.price)}</div>
                    <div className="text-xs text-gray-500">Modal: {formatCurrency(service.costPrice)}</div>
                  </div>
                  <div className="text-xs text-gray-500">Durasi: {formatDuration(service.serviceDurationMinutes)}</div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => openEdit(service)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                  >
                    Edit Jasa
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredServices.length === 0 && !isLoading && (
            <div className="text-center py-12 bg-white rounded-2xl shadow">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada jasa</h3>
              <p className="text-gray-500">Belum ada jasa untuk outlet ini.</p>
            </div>
          )}
        </div>

        {/* Services Table (desktop) */}
        <div className="hidden sm:block bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Mobile scroll hint */}
          <div className="sm:hidden px-4 py-2 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Tabel Layanan</span>
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
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="w-14 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="w-24 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Gambar
                  </th>
                  <th className="w-56 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Jasa
                  </th>
                  <th className="w-28 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Harga Modal
                  </th>
                  <th className="w-32 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga Jual
                  </th>
                  <th className="w-24 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Durasi
                  </th>
                  <th className="w-28 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Status
                  </th>
                  <th className="w-28 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.map((service, index) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex-shrink-0 h-12 w-12">
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={service.image || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
                          alt={service.name}
                        />
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center sm:block">
                        {/* Mobile: Show image inline */}
                        <div className="flex-shrink-0 h-10 w-10 mr-3 sm:hidden">
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={service.image || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
                            alt={service.name}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">
                            {service.name}
                          </div>
                          {service.description && (
                            <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-xs">
                              {service.description}
                            </div>
                          )}
                          {/* Mobile: Show status */}
                          <div className="mt-1 sm:hidden flex flex-wrap gap-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              service.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {service.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                            </span>
                          </div>
                          {/* Mobile: Show cost price */}
                          <div className="text-xs text-gray-500 mt-1 md:hidden">
                            Modal: {formatCurrency(service.costPrice)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                      {formatCurrency(service.costPrice)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{formatCurrency(service.price)}</div>
                        {/* Mobile: Show duration */}
                        <div className="text-xs text-gray-500 lg:hidden">
                          Durasi: {formatDuration(service.serviceDurationMinutes)}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                      {formatDuration(service.serviceDurationMinutes)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        service.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {service.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => openEdit(service)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>

          {/* Empty State */}
          {filteredServices.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data jasa</h3>
              <p className="text-gray-500">Belum ada jasa yang ditemukan sesuai filter yang dipilih.</p>
            </div>
          )}
        </div>
      </div>
      <EditProductServiceModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        item={selectedService as any}
        onSuccess={() => {
          setShowEditModal(false);
          fetchServices();
        }}
      />
    </DashboardLayout>
  );
}
