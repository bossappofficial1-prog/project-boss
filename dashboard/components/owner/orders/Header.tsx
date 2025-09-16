"use client";

type Props = {
  onCreate?: () => void;
};

export function OrdersHeader({ onCreate }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-poppins">Pesanan</h1>
        <p className="mt-1 text-sm text-gray-500 font-poppins">Pesanan barang yang dibeli user</p>
      </div>
      <div className="mt-4 sm:mt-0 flex space-x-3">
        <button
          onClick={onCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 font-poppins"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Pesanan Baru
        </button>
      </div>
    </div>
  );
}
