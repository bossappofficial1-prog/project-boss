"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useOutletContext } from '@/components/providers/OutletProvider';
import { toast } from 'sonner';
import { Outlet } from '@/types';
import QRISUploadModal from '@/components/modals/QRISUploadModal';
import QRISViewModal from '@/components/modals/QRISViewModal';

interface OutletsSectionProps {
  outlets: Outlet[];
  selectedOutlet?: string;
  onAddOutlet: () => void;
  onEditOutlet?: (outlet: Outlet) => void;
  onDeleteOutlet?: (outlet: Outlet) => void;
  onQRISUpdate?: () => void;
  isLoading?: boolean;
}

export default function OutletsSection({
  outlets,
  selectedOutlet,
  onAddOutlet,
  onEditOutlet,
  onDeleteOutlet,
  onQRISUpdate,
  isLoading = false
}: OutletsSectionProps) {
  const { setSelectedOutlet } = useOutletContext();
  const [selectedForAction, setSelectedForAction] = useState<string | null>(null);
  const [showQRISModal, setShowQRISModal] = useState(false);
  const [showQRISViewModal, setShowQRISViewModal] = useState(false);
  const [selectedOutletForQRIS, setSelectedOutletForQRIS] = useState<Outlet | null>(null);

  const handleSelectOutlet = (outlet: Outlet) => {

    if (outlet.id === selectedOutlet) {
      console.log(`🔄 OutletsSection: Outlet already selected, returning early`);
      return; // Already selected
    }
    setSelectedOutlet(outlet);
    toast.success('Outlet berubah', {
      description: `Beralih ke ${outlet.name}`,
      duration: 2000,
    });
  };

  const handleQRISClick = (e: React.MouseEvent, outlet: Outlet) => {
    e.stopPropagation();
    setSelectedOutletForQRIS(outlet);
    setShowQRISModal(true);
  };

  const handleViewQRISClick = (e: React.MouseEvent, outlet: Outlet) => {
    e.stopPropagation();
    setSelectedOutletForQRIS(outlet);
    setShowQRISViewModal(true);
  };

  const handleQRISSuccess = () => {
    onQRISUpdate?.();
  };

  if (!outlets || outlets.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg dark:shadow-gray-900/20 p-6 sm:p-8 border border-red-50 dark:border-gray-700 animate-fade-in-up">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Belum ada outlet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Tambahkan outlet pertama Anda untuk mulai menjual produk dan layanan
          </p>
          <Button
            onClick={onAddOutlet}
            type="button"
            className="bg-red-gradient hover:bg-red-gradient-dark rounded-xl px-6 py-3 font-medium text-white shadow-lg transition-all duration-300 hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Tambah Outlet Pertama
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg dark:shadow-gray-900/20 p-4 sm:p-6 border border-red-50 dark:border-gray-700 card-hover animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3 sm:gap-0">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Outlet Bisnis
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {outlets.length} outlet tersedia • Klik untuk beralih
            </p>
          </div>
        </div>

        <Button
          onClick={onAddOutlet}
          disabled={isLoading}
          type="button"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
          Tambah Outlet
        </Button>
      </div>

      {/* Outlets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">{outlets.map((outlet, index) => {
        const isSelected = outlet.id === selectedOutlet;
        const isActionSelected = selectedForAction === outlet.id;

        return (
          <div
            key={outlet.id}
            className={`group relative p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${isSelected
              ? 'border-red-500 bg-red-50 dark:bg-red-950/20 shadow-lg scale-[1.02]'
              : 'border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-400 hover:shadow-lg hover:scale-[1.01] bg-white dark:bg-gray-800'
              }`}
            style={{ animationDelay: `${0.1 * index}s` }}
            onClick={() => handleSelectOutlet(outlet)}
            onMouseEnter={() => setSelectedForAction(outlet.id)}
            onMouseLeave={() => setSelectedForAction(null)}
          >
            {/* Selection Indicator */}
            {isSelected && (
              <div className="absolute top-0 left-0 w-full h-1 bg-red-gradient"></div>
            )}

            {/* Action Buttons */}
            {(onEditOutlet || onDeleteOutlet) && (
              <div className={`absolute top-3 right-3 flex space-x-1 transition-all duration-200 ${isActionSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}>
                {/* QRIS Button */}
                <Button
                  onClick={(e) => handleQRISClick(e, outlet)}
                  type="button"
                  className="h-auto rounded-lg bg-green-500 p-2 text-white shadow-lg transition-all duration-200 hover:bg-green-600 hover:shadow-xl"
                  title="Upload QRIS"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </Button>
                {onEditOutlet && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditOutlet(outlet);
                    }}
                    type="button"
                    className="h-auto rounded-lg bg-blue-500 p-2 text-white shadow-lg transition-all duration-200 hover:bg-blue-600 hover:shadow-xl"
                    title="Edit Outlet"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                )}
                {onDeleteOutlet && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteOutlet(outlet);
                    }}
                    type="button"
                    className="h-auto rounded-lg bg-red-500 p-2 text-white shadow-lg transition-all duration-200 hover:bg-red-600 hover:shadow-xl"
                    title="Hapus Outlet"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                )}
              </div>
            )}

            {/* Outlet Content */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {outlet.image ? (
                  <div className="relative">
                    <img
                      src={outlet.image}
                      alt={outlet.name}
                      className="w-14 h-14 rounded-xl object-cover shadow-md"
                    />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-md ${isSelected ? 'bg-red-gradient' : 'bg-gray-gradient dark:bg-gray-gradient-dark'
                    }`}>
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-semibold truncate text-base ${isSelected
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-gray-900 dark:text-gray-100'
                    }`}>
                    {outlet.name}
                  </h3>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                  <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {outlet.address}
                </p>

                {outlet.phone && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {outlet.phone}
                  </p>
                )}

                {/* Status Badge */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {isSelected ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                      <svg className="w-2 h-2 mr-1.5 fill-current animate-pulse" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                      Outlet Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 group-hover:bg-red-50 group-hover:text-red-700 group-hover:border-red-200 dark:group-hover:bg-red-950/20 dark:group-hover:text-red-300 dark:group-hover:border-red-800 transition-colors">
                      Klik untuk pilih
                    </span>
                  )}

                  {/* QRIS Indicator */}
                  {outlet.manualQrImageUrl && (
                    <Button
                      onClick={(e) => handleViewQRISClick(e, outlet)}
                      variant="secondary"
                      type="button"
                      className="inline-flex h-auto items-center rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-medium text-green-800 transition-colors hover:bg-green-200 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                    >
                      <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Lihat QRIS
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Click indicator */}
            <div className={`absolute inset-0 rounded-xl border-2 border-dashed pointer-events-none transition-opacity duration-200 ${isActionSelected && !isSelected ? 'opacity-20 border-red-400' : 'opacity-0'
              }`}></div>
          </div>
        );
      })}
      </div>

      {/* QRIS Upload Modal */}
      <QRISUploadModal
        open={showQRISModal}
        onOpenChange={setShowQRISModal}
        outlet={selectedOutletForQRIS}
        onSuccess={handleQRISSuccess}
      />

      {/* QRIS View Modal */}
      <QRISViewModal
        open={showQRISViewModal}
        onOpenChange={setShowQRISViewModal}
        outletId={selectedOutletForQRIS?.id}
        outletName={selectedOutletForQRIS?.name}
        qrisImageUrl={selectedOutletForQRIS?.manualQrImageUrl}
      />
    </div>
  );
}
