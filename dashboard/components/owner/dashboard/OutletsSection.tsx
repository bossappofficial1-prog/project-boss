"use client";

import React from 'react';
import type { Outlet } from '@/types/dashboard';

interface OutletsSectionProps {
  outlets: Outlet[];
  selectedOutlet?: string;
  onAddOutlet: () => void;
}

export default function OutletsSection({ outlets, selectedOutlet, onAddOutlet }: OutletsSectionProps) {
  if (!outlets || outlets.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg dark:shadow-gray-900/20 p-4 sm:p-6 border border-red-50 dark:border-gray-700 card-hover animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Daftar Outlet ({outlets.length})
        </h2>
        <button onClick={onAddOutlet} className="bg-blue-gradient text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:shadow-lg transition-all duration-300 text-sm font-medium flex items-center justify-center">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah Outlet
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {outlets.map((outlet, index) => (
          <div
            key={outlet.id}
            className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 ${outlet.id === selectedOutlet
              ? 'border-red-500 bg-red-50 shadow-lg'
              : 'border-gray-200 hover:border-red-300 hover:shadow-md'
              }`}
            style={{ animationDelay: `${0.1 * index}s` }}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {outlet.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={outlet.imageUrl} alt={outlet.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-red-gradient rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{outlet.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{outlet.address}</p>
                {outlet.phone && <p className="text-sm text-gray-500 mt-1">{outlet.phone}</p>}

                {outlet.id === selectedOutlet && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <svg className="w-2 h-2 mr-1 fill-current" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                      Outlet Aktif
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
