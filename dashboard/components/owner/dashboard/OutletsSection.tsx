"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useOutletContext } from '@/components/providers/OutletProvider';
import { toast } from 'sonner';
import { Outlet } from '@/types';
import QRISUploadModal from '@/components/modals/QRISUploadModal';
import QRISViewModal from '@/components/modals/QRISViewModal';
import {
  Building2,
  Plus,
  Loader2,
  QrCode,
  Pencil,
  Trash2,
  MapPin,
  Phone,
  Check,
  Eye,
  Store,
} from 'lucide-react';

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
  isLoading = false,
}: OutletsSectionProps) {
  const { setSelectedOutlet } = useOutletContext();
  const [selectedForAction, setSelectedForAction] = useState<string | null>(null);
  const [showQRISModal, setShowQRISModal] = useState(false);
  const [showQRISViewModal, setShowQRISViewModal] = useState(false);
  const [selectedOutletForQRIS, setSelectedOutletForQRIS] = useState<Outlet | null>(null);

  const handleSelectOutlet = (outlet: Outlet) => {
    if (outlet.id === selectedOutlet) {
      console.log(`🔄 OutletsSection: Outlet already selected, returning early`);
      return;
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
      <Card className="card-hover animate-fade-in-up rounded-lg p-4">
        <div className="py-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Belum ada outlet</h3>
          <p className="mx-auto mb-6 max-w-md text-gray-600 dark:text-gray-400">
            Tambahkan outlet pertama Anda untuk mulai menjual produk dan layanan
          </p>
          <Button
            onClick={onAddOutlet}
            type="button"
            className="shadow-md transition-shadow duration-300"
          >
            <Plus className="mr-2 inline h-5 w-5" />
            Tambah Outlet Pertama
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-hover animate-fade-in-up rounded-lg p-4">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
        <div className="flex items-center">
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">Outlet Bisnis</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {outlets.length} outlet tersedia • Klik untuk beralih
            </p>
          </div>
        </div>

        <Button onClick={onAddOutlet} disabled={isLoading} type="button">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-1.5 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />
          )}
          Tambah Outlet
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {outlets.map((outlet, index) => {
          const isSelected = outlet.id === selectedOutlet;
          const isActionSelected = selectedForAction === outlet.id;

          return (
            <div
              key={outlet.id}
              className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 p-4 transition-all duration-300 sm:p-5 ${isSelected
                ? 'scale-[1.02] border-red-500 bg-red-50 shadow-lg dark:bg-red-950/20'
                : 'border-gray-200 bg-white hover:scale-[1.01] hover:border-red-300 hover:shadow-lg dark:border-gray-600 dark:bg-gray-800 dark:hover:border-red-400'
                }`}
              style={{ animationDelay: `${0.1 * index}s` }}
              onClick={() => handleSelectOutlet(outlet)}
              onMouseEnter={() => setSelectedForAction(outlet.id)}
              onMouseLeave={() => setSelectedForAction(null)}
            >
              {isSelected && <div className="absolute left-0 top-0 h-1 w-full bg-red-gradient" />}

              {(onEditOutlet || onDeleteOutlet) && (
                <div
                  className={`absolute right-3 top-3 flex space-x-1 transition-all duration-200 ${isActionSelected ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                    }`}
                >
                  <Button
                    onClick={(e) => handleQRISClick(e, outlet)}
                    type="button"
                    className="h-auto rounded-lg bg-green-500 p-2 text-white shadow-lg transition-all duration-200 hover:bg-green-600 hover:shadow-xl"
                    title="Upload QRIS"
                  >
                    <QrCode className="h-3.5 w-3.5" />
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
                      <Pencil className="h-3.5 w-3.5" />
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
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {outlet.image ? (
                    <div className="relative">
                      <img
                        src={outlet.image}
                        alt={outlet.name}
                        className="h-14 w-14 rounded-xl object-cover shadow-md"
                      />
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`relative flex h-14 w-14 items-center justify-center rounded-xl shadow-md ${isSelected ? 'bg-red-gradient' : 'bg-gray-gradient dark:bg-gray-gradient-dark'
                        }`}
                    >
                      <Store className="h-7 w-7 text-white" />
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white">
                          <Check className="h-3 w-3 text-red-500" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <h3
                      className={`truncate text-base font-semibold ${isSelected ? 'text-red-700 dark:text-red-300' : 'text-gray-900 dark:text-gray-100'
                        }`}
                    >
                      {outlet.name}
                    </h3>
                  </div>

                  <p className="mb-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                    <MapPin className="mr-1 inline h-3.5 w-3.5" />
                    {outlet.address}
                  </p>

                  {outlet.phone && (
                    <p className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Phone className="mr-1 h-3 w-3" />
                      {outlet.phone}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {isSelected ? (
                      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-3 py-1 text-xs font-medium text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                        <span className="mr-1.5 flex h-2 w-2 animate-pulse rounded-full bg-current" />
                        Outlet Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 transition-colors group-hover:border-red-200 group-hover:bg-red-50 group-hover:text-red-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:group-hover:border-red-800 dark:group-hover:bg-red-950/20 dark:group-hover:text-red-300">
                        Klik untuk pilih
                      </span>
                    )}

                    {outlet.manualQrImageUrl && (
                      <Button
                        onClick={(e) => handleViewQRISClick(e, outlet)}
                        variant="secondary"
                        type="button"
                        className="inline-flex h-auto items-center rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-medium text-green-800 transition-colors hover:bg-green-200 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                      >
                        <Eye className="mr-1.5 h-3 w-3" />
                        Lihat QRIS
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`pointer-events-none absolute inset-0 rounded-xl border-2 border-dashed transition-opacity duration-200 ${isActionSelected && !isSelected ? 'border-red-400 opacity-20' : 'opacity-0'
                  }`}
              />
            </div>
          );
        })}
      </div>

      <QRISUploadModal
        open={showQRISModal}
        onOpenChange={setShowQRISModal}
        outlet={selectedOutletForQRIS}
        onSuccess={handleQRISSuccess}
      />

      <QRISViewModal
        open={showQRISViewModal}
        onOpenChange={setShowQRISViewModal}
        outletId={selectedOutletForQRIS?.id}
        outletName={selectedOutletForQRIS?.name}
        qrisImageUrl={selectedOutletForQRIS?.manualQrImageUrl}
      />
    </Card>
  );
}
