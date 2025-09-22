'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Store, AlertCircle, Loader2 } from 'lucide-react'
import MapPicker from '@/components/ui/MapPicker'
import ImageUploader from '@/components/ui/ImageUploader'
import OperatingHoursManager from '@/components/ui/OperatingHoursManager'
import { Toaster, toast } from 'sonner'
import { useUpsertOperatingHours } from '@/hooks/useOperatingHours'
import { outletManagementApi, uploadApi } from '@/lib/api'
import type { OutletDetail, OperatingHours, OperatingHoursFormData } from '@/types/dashboard'

// 1. Skema Validasi dengan Zod
const outletSchema = z.object({
  name: z.string().min(1, 'Nama outlet wajib diisi'),
  address: z.string().min(1, 'Alamat wajib diisi'),
  phone: z.string().min(10, 'Nomor telepon tidak valid').max(15, 'Nomor telepon tidak valid'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  file: z.instanceof(File)
    .refine((file) => file.size <= 1024 * 1024, `Ukuran gambar maksimal 1MB.`)
    .optional()
})

type OutletFormData = z.infer<typeof outletSchema>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
  onSuccess?: () => void
  mode?: 'add' | 'edit'
  outlet?: OutletDetail | null
}

export default function AddOutletModal({ open, onOpenChange, businessId, onSuccess, mode = 'add', outlet }: Props) {
  const [operatingHoursData, setOperatingHoursData] = useState<Record<number, OperatingHoursFormData>>({})

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    watch,
    formState: { errors, isValid }
  } = useForm({
    resolver: zodResolver(outletSchema),
    mode: 'onChange'
  })

  const upsertMutation = useUpsertOperatingHours()

  // Fetch outlet detail for edit mode
  const { data: outletDetail } = useQuery({
    queryKey: ['outlet-detail', outlet?.id],
    queryFn: () => outletManagementApi.getById(outlet!.id),
    enabled: !!outlet?.id && open && mode === 'edit',
  }) as { data: OutletDetail | undefined }

  const { mutate, isPending: isSubmitting } = useMutation({
    mutationFn: async (data: OutletFormData) => {
      if (mode === 'edit') {
        if (!outletDetail) {
          throw new Error('Outlet tidak ditemukan')
        }

        let finalImageUrl: string | undefined = outletDetail.image
        if (data.file) {
          const uploaded = await uploadApi.uploadImage(data.file, { scope: 'outlet' })
          finalImageUrl = uploaded.url
        }

        const payload = {
          name: data.name,
          address: data.address,
          phone: data.phone,
          ...(data.description && { description: data.description }),
          image: finalImageUrl,
          latitude: data.latitude,
          longitude: data.longitude,
          isOpen: data.status === 'ACTIVE',
        }
        return outletManagementApi.update(outletDetail.id, payload)
      } else {
        // Add mode
        if (!businessId) {
          throw new Error('Silakan buat profil bisnis terlebih dahulu.')
        }

        let finalImageUrl: string | undefined = undefined
        if (data.file) {
          const uploaded = await uploadApi.uploadImage(data.file, { scope: 'outlet' })
          finalImageUrl = uploaded.url
        }

        const payload = {
          name: data.name,
          address: data.address,
          phone: data.phone,
          ...(data.description && { description: data.description }),
          businessId,
          image: finalImageUrl,
          latitude: data.latitude,
          longitude: data.longitude,
        }

        return outletManagementApi.create(payload)
      }
    },
    onSuccess: async (outletData) => {
      toast.success(mode === 'edit' ? 'Outlet Berhasil Diperbarui!' : 'Outlet Berhasil Ditambahkan!')

      // Update operating hours if any data exists
      const operatingHoursPromises = Object.values(operatingHoursData)
        .filter((data: OperatingHoursFormData) => data.isOpen !== undefined)
        .map((data: OperatingHoursFormData) =>
          upsertMutation.mutateAsync({
            outletId: mode === 'edit' ? outletDetail!.id : outletData.id,
            dayOfWeek: data.dayOfWeek,
            openTime: new Date(`1970-01-01T${data.openTime}:00`),
            closeTime: new Date(`1970-01-01T${data.closeTime}:00`),
            isOpen: data.isOpen
          })
        )

      if (operatingHoursPromises.length > 0) {
        try {
          await Promise.all(operatingHoursPromises)
          toast.success('Jam operasional berhasil disimpan!')
        } catch (error) {
          toast.error('Outlet berhasil dibuat, tapi gagal menyimpan jam operasional')
        }
      }

      onSuccess?.()
      onOpenChange(false)
    },
    onError: (e: any) => {
      toast.error(e?.message || 'Gagal menambah outlet. Coba lagi.')
    }
  })

  // Populate form when outlet changes (edit mode)
  useEffect(() => {
    if (outletDetail && open && mode === 'edit') {
      setValue('name', outletDetail.name)
      setValue('address', outletDetail.address || '')
      setValue('phone', outletDetail.phone || '')
      setValue('description', outletDetail.description || '')
      setValue('status', outletDetail.isOpen ? 'ACTIVE' : 'INACTIVE')
      setValue('latitude', outletDetail.latitude)
      setValue('longitude', outletDetail.longitude)
    }
  }, [outletDetail, open, mode, setValue])

  // Populate operating hours when outlet detail is loaded (edit mode)
  useEffect(() => {
    if (outletDetail?.operatingHours && outletDetail.operatingHours.length > 0 && mode === 'edit') {
      const hoursMap: Record<number, OperatingHoursFormData> = {}
      outletDetail.operatingHours.forEach((hour: OperatingHours) => {
        // Convert ISO time strings to HH:MM format
        const openTime = hour.openTime ? new Date(hour.openTime).toTimeString().slice(0, 5) : '09:00'
        const closeTime = hour.closeTime ? new Date(hour.closeTime).toTimeString().slice(0, 5) : '17:00'

        hoursMap[hour.dayOfWeek] = {
          id: hour.id,
          outletId: hour.outletId,
          dayOfWeek: hour.dayOfWeek,
          openTime: openTime,
          closeTime: closeTime,
          isOpen: hour.isOpen
        }
      })
      setOperatingHoursData(hoursMap)
    }
  }, [outletDetail, mode])

  // Reset form saat modal ditutup
  useEffect(() => {
    if (!open) {
      reset()
      setOperatingHoursData({})
    }
  }, [open, reset])

  const handleLocationSelect = async (lat: number, lng: number) => {
    setValue('latitude', lat, { shouldValidate: true })
    setValue('longitude', lng, { shouldValidate: true })

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
        if (data.display_name && !watch('address')) {
          // Only auto-fill address if it's empty
          setValue('address', data.display_name, { shouldValidate: true })
        }
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
    }
  }

  const onSubmit = (data: OutletFormData) => {
    mutate(data)
  }

  return (
    <>
      <Toaster richColors position="top-center" />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] min-w-fit flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Store className="h-6 w-6 text-red-500" />
              {mode === 'edit' ? 'Edit Outlet' : 'Tambah Outlet Baru'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'edit'
                ? 'Perbarui informasi outlet dan atur jam operasional Anda.'
                : 'Lengkapi informasi outlet dan atur jam operasional Anda.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-6 py-4">
            {!businessId && (
              <div className="flex items-start gap-3 p-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Bisnis Belum Dibuat</p>
                  <p className="text-xs mt-1">Anda perlu membuat profil bisnis terlebih dahulu.</p>
                </div>
              </div>
            )}

            {/* Section: Informasi Dasar */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Informasi Dasar</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Nama Outlet</Label>
                  <Input id="name" placeholder="Contoh: Outlet Utama" {...register('name')} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>

                <div className="md:col-span-1">
                  <Label htmlFor="status">Status Outlet</Label>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Aktif</SelectItem>
                          <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="md:col-span-3">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea id="description" placeholder="Deskripsi singkat tentang outlet" {...register('description')} />
                </div>
              </div>
            </div>

            {/* Section: Informasi Kontak */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Informasi Kontak</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="phone">No. Telepon</Label>
                  <Input id="phone" placeholder="08xxxxxxxxxx" {...register('phone')} />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                </div>
              </div>
            </div>

            {/* Section: Jam Operasional */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Jam Operasional</h3>
              <OperatingHoursManager
                outletId={mode === 'edit' ? outletDetail?.id || "" : ""}
                operatingHoursData={operatingHoursData}
                onOperatingHoursChange={setOperatingHoursData}
              />
            </div>

            {/* Section: Lokasi */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Lokasi</h3>
              <div>
                <Label htmlFor="address">Alamat</Label>
                <Input id="address" placeholder="Alamat lengkap outlet" {...register('address')} />
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
              </div>
              <Controller
                control={control}
                name="latitude"
                render={({ field }) => (
                  <MapPicker
                    latitude={field.value}
                    longitude={watch('longitude')}
                    onLocationChange={handleLocationSelect}
                    placeholder="Cari lokasi atau klik pada peta..."
                    className="w-full"
                  />
                )}
              />
            </div>

            {/* Section: Media */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Media</h3>
              <div>
                <Label>Gambar Outlet</Label>
                <p className="text-xs text-gray-500 mb-2">Ukuran file maksimal 1MB.</p>

                {mode === 'edit' && outletDetail?.image && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-3">
                    <div className="flex items-center gap-3">
                      <img src={outletDetail.image} alt="Current outlet image" className="h-12 w-12 object-cover rounded-md" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Gambar saat ini</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Upload gambar baru untuk mengganti</p>
                      </div>
                    </div>
                  </div>
                )}

                <Controller
                  control={control}
                  name="file"
                  render={({ field }) => <ImageUploader onFileChange={field.onChange} />}
                />
                {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file.message}</p>}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting || !isValid || (mode === 'add' && !businessId)}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  mode === 'edit' ? 'Simpan Perubahan' : 'Simpan Outlet'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}