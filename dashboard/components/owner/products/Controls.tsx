"use client";

interface ControlsProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (val: number) => void;
  onRefresh: () => void;
  onAdd: () => void;
  onImport: () => void;
  onExport: () => void;
  hasOutlet: boolean;
}

export default function ProductsControls({
  searchQuery,
  onSearchChange,
  itemsPerPage,
  onItemsPerPageChange,
  onRefresh,
  onAdd,
  onImport,
  onExport,
  hasOutlet,
}: ControlsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:border-red-400"
            />
          </div>
        </div>
        <div>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:focus:border-red-400"
          >
            <option value={10}>10 per halaman</option>
            <option value={15}>15 per halaman</option>
            <option value={25}>25 per halaman</option>
            <option value={50}>50 per halaman</option>
          </select>
        </div>
        <div className="flex space-x-2">
          <button onClick={onRefresh} className="flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex-1 justify-center lg:flex-initial lg:justify-start" title="Refresh Data">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="ml-2 hidden lg:inline">Refresh</span>
          </button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => hasOutlet && onAdd()} disabled={!hasOutlet} className={`flex items-center justify-center px-6 py-3 rounded-lg transition-all duration-300 ${hasOutlet ? 'bg-red-gradient text-white hover:shadow-lg' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah Produk
        </button>
        <button onClick={() => hasOutlet && onImport()} disabled={!hasOutlet} className={`flex items-center justify-center px-6 py-3 rounded-lg transition-all duration-300 ${hasOutlet ? 'bg-green-gradient text-white hover:shadow-lg' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Import Data
        </button>
        <button onClick={onExport} className="flex items-center justify-center px-6 py-3 bg-blue-gradient text-white rounded-lg hover:shadow-lg transition-all duration-300">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Data
        </button>
      </div>
    </>
  );
}
