"use client";

export function QueueEmptyState() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-64 flex items-center justify-center">
      <div className="text-center p-8">
        <div className="mx-auto h-20 w-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
          <svg className="h-10 w-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1 font-poppins">Belum ada antrian</h3>
        <p className="text-sm text-gray-500 font-poppins">Antrian barang dan jasa akan tampil di sini.</p>
      </div>
    </div>
  );
}
