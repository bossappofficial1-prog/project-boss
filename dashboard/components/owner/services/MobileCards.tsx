"use client";

import { ServiceItem } from '@/hooks/useServicesData';
import { resolveUploadImageUrl } from '@/lib/url';

interface MobileCardsProps {
  services: ServiceItem[];
  onEdit: (s: ServiceItem) => void;
  formatCurrency: (n: number) => string;
  formatDuration: (n?: number) => string;
}

export default function ServicesMobileCards({ services, onEdit, formatCurrency, formatDuration }: MobileCardsProps) {
  return (
    <div className="sm:hidden space-y-3">
      {services.map((service) => (
        <div key={service.id} className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/20 p-4 flex gap-3 border dark:border-gray-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveUploadImageUrl(service.image) || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
            alt={service.name}
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png';
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{service.name}</div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${service.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {service.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
              </span>
            </div>
            {service.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{service.description}</div>
            )}
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <div className="font-medium">{formatCurrency(service.price)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Modal: {formatCurrency(service.costPrice)}</div>
              </div>
              <div className="text-right">Durasi: {formatDuration(service.serviceDurationMinutes)}</div>
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={() => onEdit(service)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">Edit Jasa</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
