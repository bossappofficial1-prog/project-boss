"use client";

type Props = {
  status: string;
  onStatusChange: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
};

export function OrdersControls({ status, onStatusChange, search, onSearchChange }: Props) {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="relative flex-1 max-w-sm">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari nama atau kode..."
          className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-poppins"
        />
        <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
      </div>
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-poppins"
      >
        <option value="">Semua Status</option>
        <option value="AWAITING_PAYMENT">Menunggu Pembayaran</option>
        <option value="PROCESSING">Diproses</option>
        <option value="READY">Siap</option>
        <option value="COMPLETED">Selesai</option>
        <option value="CANCELLED">Dibatalkan</option>
      </select>
    </div>
  );
}
