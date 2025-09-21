"use client";

import { ServiceItem } from '@/hooks/useServicesData';
import { resolveUploadImageUrl } from '@/lib/url';

interface DesktopTableProps {
  services: ServiceItem[];
  onEdit: (s: ServiceItem) => void;
  formatCurrency: (n: number) => string;
  formatDuration: (n?: number) => string;
}

export default function ServicesDesktopTable({ services, onEdit, formatCurrency, formatDuration }: DesktopTableProps) {
  return (
    <div className="hidden sm:block overflow-x-auto rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 table-fixed">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="w-14 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">No</th>
            <th className="w-24 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Gambar</th>
            <th className="w-56 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Jasa</th>
            <th className="w-28 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Harga Modal</th>
            <th className="w-32 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Harga Jual</th>
            <th className="w-24 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Durasi</th>
            <th className="w-28 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
            <th className="w-28 px-3 sm:px-4 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {services.map((service, index) => (
            <tr key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{index + 1}</td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="h-12 w-12 rounded-lg object-cover"
                  src={resolveUploadImageUrl(service.image) || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
                  alt={service.name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png';
                  }}
                />
              </td>
              <td className="px-3 sm:px-6 py-4">
                <div className="flex items-center sm:block">
                  {/* Mobile image */}
                  <div className="flex-shrink-0 h-10 w-10 mr-3 sm:hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="h-10 w-10 rounded-lg object-cover"
                      src={resolveUploadImageUrl(service.image) || 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png'}
                      alt={service.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://png.pngtree.com/png-vector/20230808/ourmid/pngtree-goods-and-services-vector-png-image_6891390.png';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{service.name}</div>
                    {service.description && (
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate max-w-[120px] sm:max-w-xs">{service.description}</div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 md:hidden">Modal: {formatCurrency(service.costPrice)}</div>
                    <div className="mt-1 sm:hidden flex flex-wrap gap-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${service.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{service.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 hidden md:table-cell">{formatCurrency(service.costPrice)}</td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                <div>
                  <div className="font-medium">{formatCurrency(service.price)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 lg:hidden">Durasi: {formatDuration(service.serviceDurationMinutes)}</div>
                </div>
              </td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 hidden lg:table-cell">{formatDuration(service.serviceDurationMinutes)}</td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${service.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{service.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}</span>
              </td>
              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                <button onClick={() => onEdit(service)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
