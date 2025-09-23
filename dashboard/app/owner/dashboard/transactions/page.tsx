'use client';


export default function TransactionsPage() {
  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-poppins">Riwayat Transaksi</h1>
            <p className="mt-1 text-sm text-gray-500 font-poppins">
              Lihat semua riwayat transaksi bisnis Anda
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-poppins"
            />
            <select className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-poppins">
              <option value="">Semua Tipe</option>
              <option value="SALE">Penjualan</option>
              <option value="EXPENSE">Pengeluaran</option>
              <option value="REFUND">Refund</option>
            </select>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 font-poppins">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-96">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <svg className="h-12 w-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 font-poppins">Halaman Riwayat Transaksi</h3>
              <p className="text-gray-600 font-poppins mb-4">
                Konten untuk riwayat transaksi akan diimplementasikan di sini.
              </p>
              <p className="text-sm text-gray-400 font-poppins">
                Fitur: Transaction history, filter, search, receipt, payment details, dll.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
