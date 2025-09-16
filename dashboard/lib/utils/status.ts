export type StatusInfo = {
  label: string;
  className: string; // Tailwind classes for badge background/text (supports dark mode)
};

function normalize(status?: string | null): string {
  return (status || '').toString().trim().toUpperCase();
}

const DEFAULT_INFO: StatusInfo = {
  label: 'Tidak Diketahui',
  className:
    'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300',
};

const MAP: Record<string, StatusInfo> = {
  // Order lifecycle
  PENDING: {
    label: 'Menunggu',
    className: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
  },
  CONFIRMED: {
    label: 'Terkonfirmasi',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  },
  PROCESSING: {
    label: 'Diproses',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  },
  READY: {
    label: 'Siap Diambil',
    className: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  },
  COMPLETED: {
    label: 'Selesai',
    className: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  },
  FAILED: {
    label: 'Gagal',
    className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  },
  REFUNDED: {
    label: 'Dana Dikembalikan',
    className: 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300',
  },
  // Generic/legacy fallbacks
  QUEUED: {
    label: 'Dalam Antrian',
    className: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  },
};

export function getOrderStatusInfo(status?: string | null): StatusInfo {
  const key = normalize(status);
  return MAP[key] || DEFAULT_INFO;
}

export function getQueueStatusInfo(status?: string | null): StatusInfo {
  const key = normalize(status);
  return MAP[key] || DEFAULT_INFO;
}
