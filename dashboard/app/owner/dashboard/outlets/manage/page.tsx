'use client';

import { useCallback, useEffect, useState } from 'react';
import { Save, X, Upload, MapPin, Phone, Mail, DollarSign, Clock, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import MapPicker from '@/components/ui/MapPicker';
import { toast } from 'sonner';
import OperatingHoursModal from '@/components/OperatingHoursModal';
import { useOutletContext } from '@/components/providers/OutletProvider';
import type { Outlet } from '@/types';
import ImageUploader from '@/components/ui/ImageUploader';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { outletManagementApi, uploadApi } from '@/lib/api';

export default function ManageOutletsPage() {
  const { selectedOutlet, isLoading: outletLoading } = useOutletContext()
  const isLoading = outletLoading;
  const [isEditing, setIsEditing] = useState(false);
  const [isOperatingHoursModalOpen, setIsOperatingHoursModalOpen] = useState(false);
  const [formData, setFormData] = useState<Outlet | null>(null);
  const [qrisPreview, setQrisPreview] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const queryClient = useQueryClient()

  const handleSave = async () => {
    try {
      let outletData: Partial<Outlet> | null = null;
      let finalImageUrl: string | undefined = undefined
      let finalQrImageUrl: string | undefined = undefined

      if (formData?.image && ((formData.image as any) instanceof File)) { finalImageUrl = (await uploadApi.uploadImage(formData.image as any)).url; }
      if (formData?.manualQrImageUrl && ((formData.manualQrImageUrl as any) instanceof File)) { finalQrImageUrl = (await uploadApi.uploadImage(formData.manualQrImageUrl as any)).url; }

      outletData = {
        name: formData?.name,
        address: formData?.address,
        phone: formData?.phone,
        ...(formData?.description && { description: formData.description }),
        image: finalImageUrl,
        latitude: formData?.latitude,
        longitude: formData?.longitude,
        isOpen: formData?.isOpen,
        manualQrImageUrl: finalQrImageUrl
      }
      outletManagementApi.update(selectedOutlet?.id!, outletData!)
      setIsEditing(false);
      toast.success("Outlet berhasil diperbarui")
    } catch (error) {
      toast.error((error as any).message || "Gagal memperbarui outlet")
    }
  };

  const { mutate: submit, isPending: isSaving } = useMutation({
    mutationFn: handleSave,
    onSuccess: () => {
      queryClient.resetQueries({ queryKey: ["outlets"] })
      queryClient.refetchQueries({ queryKey: ["outlets"] })
    },
    onError: (error) => {
      toast.error(`Gagal memperbarui outlet, error: ${error.message}`)
    }
  })

  // Initialize form data ketika selectedOutlet tersedia
  useEffect(() => {
    if (selectedOutlet) {
      setFormData(selectedOutlet);
      setQrisPreview(selectedOutlet.manualQrImageUrl || null);
      setImagePreview(selectedOutlet.image || null);
      setIsEditing(false);
      setIsOperatingHoursModalOpen(false);
    }
  }, [selectedOutlet?.id]);

  // Define all handlers BEFORE early return
  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
    if (!formData) return;

    setFormData(prev => prev ? { ...prev, latitude: lat, longitude: lng } : null)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ProjectBoss/1.0'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()

        if (data.display_name) {
          setFormData(prev => prev ? { ...prev, address: data.display_name } : null)
        }
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
    }
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!formData) return;

    const { name, value } = e.target;
    setFormData(prev =>
      prev ? {
        ...prev,
        [name]: value
      } : null
    );
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;

    const { name, checked } = e.target;
    setFormData(prev =>
      prev ? {
        ...prev,
        [name]: checked
      } : null
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement> | File, type: 'outlet' | 'qris') => {
    if (!formData) return;
    let file;
    if (e instanceof File) { file = e }
    else { file = e.target.files?.[0] }

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'outlet') {
          setImagePreview(result);
          setFormData(prev =>
            prev ? {
              ...prev,
              image: file as any
            } : null
          );
        } else {
          setQrisPreview(result);
          setFormData(prev =>
            prev ? {
              ...prev,
              manualQrImageUrl: file as any
            } : null
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    if (selectedOutlet) {
      setFormData(selectedOutlet);
      setImagePreview(selectedOutlet.image || null);
      setQrisPreview(selectedOutlet.manualQrImageUrl || null);
    }
    setIsEditing(false);
  };

  // Early return AFTER semua hooks didefinisikan
  if (isLoading || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat data outlet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Manajemen Outlet
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kelola informasi dan pengaturan outlet yang sedang aktif
            </p>
          </div>
          <div className='flex gap-2'>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
              >
                Edit Informasi
              </Button>
            )}
            <Button
              onClick={() => setIsOperatingHoursModalOpen(true)}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              <Clock size={18} />
              Edit Jam Operasional
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Outlet Image Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
              {/* Image Preview */}
              <div className="relative h-64 bg-gray-100 dark:bg-gray-900 overflow-hidden">
                {imagePreview && (
                  <Image
                    src={imagePreview}
                    alt="Outlet"
                    fill
                    className="object-cover"
                  />
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <label className="cursor-pointer">
                      <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
                        <Upload size={16} />
                        Ganti Foto
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'outlet')}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Outlet Info Card */}
              <div className="p-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nama Outlet
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Deskripsi
                      </label>
                      <textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="isOpen"
                        checked={formData.isOpen}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                        Outlet Buka
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                          {formData.name}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {formData.description}
                        </p>
                      </div>
                      <Badge
                        className={`${formData.isOpen
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                          }`}
                      >
                        {formData.isOpen ? 'Buka' : 'Tutup'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Informasi Kontak
              </h3>

              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nomor Telepon
                      </label>
                      <div className="flex items-center gap-2">
                        <Phone size={18} className="text-gray-400" />
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone || ''}
                          onChange={handleInputChange}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Alamat</Label>
                      <Input
                        id="address"
                        value={formData.address || ""}
                        placeholder="Alamat lengkap outlet"
                        onChange={handleInputChange}
                      />

                      <div className="flex gap-2">
                        <MapPicker
                          latitude={formData.latitude || 0}
                          longitude={formData.longitude || 0}
                          onLocationChange={handleLocationSelect}
                          placeholder="Cari lokasi atau klik pada peta..."
                          className="w-full"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Telepon</p>
                        <p className="text-gray-900 dark:text-white font-medium">{formData.phone || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Alamat</p>
                        <p className="text-gray-900 dark:text-white font-medium">{formData.address || '-'}</p>
                      </div>
                    </div>

                    {formData.latitude && formData.longitude && (
                      <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <MapPin size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Koordinat</p>
                          <p className="text-gray-900 dark:text-white font-medium text-sm">
                            {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className='lg:col-span-2'>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ImageIcon size={18} />
                QRIS
              </h3>

              {isEditing ? (
                <div>
                  <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    {qrisPreview &&
                      <Image
                        src={qrisPreview}
                        alt="QRIS"
                        fill
                        className="object-cover"
                      />
                    }
                  </div>
                  <ImageUploader onFileChange={(file) => { handleImageUpload(file!, 'qris') }} />
                </div>
              ) : (
                <div>
                  {qrisPreview ? (
                    <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <Image
                        src={qrisPreview}
                        alt="QRIS"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600">
                      <div className="text-center">
                        <ImageIcon size={32} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Belum ada QRIS
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 shadow-lg">
            <div className="max-w-6xl mx-auto flex justify-end gap-3">
              <Button
                onClick={handleCancel}
                className="px-6 py-2 rounded-lg font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={18} />
                Batal
              </Button>
              <Button
                onClick={() => submit()}
                disabled={isLoading}
                className="px-6 py-2 rounded-lg font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </div>
        )}

        {isEditing && <div className="h-24" />}
      </div>

      {/* Operating Hours Modal */}
      <OperatingHoursModal
        isOpen={isOperatingHoursModalOpen}
        onClose={() => setIsOperatingHoursModalOpen(false)}
        outletId={selectedOutlet?.id || ''}
      />
    </div>
  );
}