'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';

export default function OrdersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-poppins">Pesanan</h1>
            <p className="mt-1 text-sm text-gray-500 font-poppins">
              Kelola semua pesanan masuk dan keluar
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <select className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-poppins">
              <option value="">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 font-poppins">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Pesanan Baru
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-96">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="mx-auto h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 font-poppins">Halaman Pesanan</h3>
              <p className="text-gray-600 font-poppins mb-4">
                Konten untuk mengelola pesanan akan diimplementasikan di sini.
              </p>
              <p className="text-sm text-gray-400 font-poppins">
                Fitur: Daftar pesanan, update status, cetak struk, tracking, dll.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
