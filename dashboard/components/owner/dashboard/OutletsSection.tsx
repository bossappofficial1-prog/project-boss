"use client";

import React from 'react';
import type { Outlet } from '@/types/dashboard';

interface OutletsSectionProps {
  outlets: Outlet[];
  selectedOutlet?: string;
  onAddOutlet: () => void;
  onEditOutlet?: (outlet: Outlet) => void;
  onDeleteOutlet?: (outlet: Outlet) => void;
}

export default function OutletsSection({ outlets, selectedOutlet, onAddOutlet, onEditOutlet, onDeleteOutlet }: OutletsSectionProps) {
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
        <button onClick={onAddOutlet} className="bg-blue-gradient text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 dark:hover:shadow-blue-500/40 transition-all duration-300 text-sm font-medium flex items-center justify-center">
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
            className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 relative ${outlet.id === selectedOutlet
              ? 'border-red-500 bg-red-50 dark:bg-red-950/20 shadow-lg'
              : 'border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-400 hover:shadow-md'
              }`}
            style={{ animationDelay: `${0.1 * index}s` }}
          >
            {/* Action Buttons */}
            {(onEditOutlet || onDeleteOutlet) && (
              <div className="absolute top-3 right-3 flex space-x-1">
                {onEditOutlet && (
                  <button
                    onClick={() => onEditOutlet(outlet)}
                    className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200 opacity-0 group-hover:opacity-100 hover:opacity-100"
                    title="Edit Outlet"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                {onDeleteOutlet && (
                  <button
                    onClick={() => onDeleteOutlet(outlet)}
                    className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors duration-200 opacity-0 group-hover:opacity-100 hover:opacity-100"
                    title="Hapus Outlet"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            <div className="flex items-start space-x-4 group">
              <div className="flex-shrink-0">
                {outlet.imageUrl ? (
                  <img src={outlet.imageUrl} alt={outlet.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-red-gradient dark:bg-red-gradient-dark rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{outlet.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{outlet.address}</p>
                {outlet.phone && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{outlet.phone}</p>}

                {outlet.id === selectedOutlet && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
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
