"use client";

export function OrdersEmptyState() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-64 flex items-center justify-center">
      <div className="text-center p-8">
        <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1 font-poppins">Belum ada pesanan</h3>
        <p className="text-sm text-gray-500 font-poppins">Pesanan barang yang dibeli user akan tampil di sini.</p>
      </div>
    </div>
  );
}
