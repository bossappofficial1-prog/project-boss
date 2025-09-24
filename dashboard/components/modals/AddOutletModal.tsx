'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { isEqual } from 'lodash'

/**
 * AddOutletModal Component - Optimized for Performance
 * 
 * Performance Optimizations Applied:
 * 1. useMemo for form config and query keys to prevent unnecessary object recreation
 * 2. useCallback for all handler functions to prevent child component re-renders
 * 3. Optimized dependency arrays in useEffect to minimize re-runs
 * 4. Efficient cache invalidation strategy that only invalidates specific queries
 * 5. Memoized mutation functions and callbacks
 * 6. Separated form population and operating hours parsing into reusable functions
 */

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
  const [initialOperatingHours, setInitialOperatingHours] = useState<Record<number, OperatingHoursFormData>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [operatingHoursChanged, setOperatingHoursChanged] = useState(false)
  const queryClient = useQueryClient()

  // Memoize form config to prevent unnecessary re-renders
  const formConfig = useMemo(() => ({
    resolver: zodResolver(outletSchema),
    mode: 'onChange' as const
  }), [])

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    watch,
    formState: { errors, isValid }
  } = useForm(formConfig)

  const upsertMutation = useUpsertOperatingHours()

  // Memoize query key to prevent unnecessary re-fetches
  const outletQueryKey = useMemo(() =>
    ['outlet-detail', outlet?.id],
    [outlet?.id]
  )

  // Fetch outlet detail for edit mode
  const { data: outletDetail } = useQuery({
    queryKey: outletQueryKey,
    queryFn: () => outletManagementApi.getById(outlet!.id),
    enabled: !!outlet?.id && open && mode === 'edit',
    staleTime: 5 * 60 * 1000, // 5 minutes
  }) as { data: OutletDetail | undefined }

  // Simplified mutation function - combines outlet and operating hours
  const mutationFn = useCallback(async (data: OutletFormData) => {
    let outletResult: any

    // 1. Handle outlet creation/update
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
      outletResult = await outletManagementApi.update(outletDetail.id, payload)
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
      outletResult = await outletManagementApi.create(payload)
    }

    // 2. Handle operating hours if any changes exist
    const hasOperatingHoursChanges = Object.values(operatingHoursData).some(
      (data: OperatingHoursFormData) => data.isOpen !== undefined
    )

    if (hasOperatingHoursChanges) {
      const operatingHoursPromises = Object.values(operatingHoursData)
        .filter((data: OperatingHoursFormData) => data.isOpen !== undefined)
        .map((data: OperatingHoursFormData) =>
          upsertMutation.mutateAsync({
            outletId: mode === 'edit' ? outletDetail!.id : outletResult.id,
            dayOfWeek: data.dayOfWeek,
            openTime: new Date(`1970-01-01T${data.openTime}:00`),
            closeTime: new Date(`1970-01-01T${data.closeTime}:00`),
            isOpen: data.isOpen
          })
        )

      try {
        await Promise.all(operatingHoursPromises)
      } catch (error) {
        // Don't fail the entire operation if operating hours fail
        console.error('Failed to save operating hours:', error)
        toast.warning('Outlet berhasil disimpan, tapi jam operasional gagal disimpan')
      }
    }

    return outletResult
  }, [mode, outletDetail, businessId, operatingHoursData, upsertMutation])

  // Optimized cache invalidation strategy
  const invalidateQueries = useCallback(async (outletId?: string) => {
    const promises = []

    if (mode === 'edit' && outletId) {
      // Only invalidate specific outlet detail when editing
      promises.push(
        queryClient.invalidateQueries({ queryKey: ['outlet-detail', outletId] })
      )
    }

    // Always invalidate outlets list and dashboard
    promises.push(
      queryClient.invalidateQueries({ queryKey: ['outlets'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    )

    await Promise.all(promises)
  }, [mode, queryClient])

  // Simplified onSuccess callback
  const onSuccessCallback = useCallback(async (outletData: any) => {
    toast.success(mode === 'edit' ? 'Outlet Berhasil Diperbarui!' : 'Outlet Berhasil Ditambahkan!')

    // Invalidate queries to refresh cache
    await invalidateQueries(mode === 'edit' ? outletDetail?.id : outletData.id)

    onSuccess?.()
    onOpenChange(false)
  }, [mode, outletDetail?.id, invalidateQueries, onSuccess, onOpenChange])

  const { mutate, isPending: isSubmitting } = useMutation({
    mutationFn,
    onSuccess: onSuccessCallback,
    onError: (e: any) => {
      toast.error(e?.message || 'Gagal menambah outlet. Coba lagi.')
    }
  })

  // Memoize operating hours parsing to prevent recalculation
  const parseOperatingHours = useCallback((operatingHours: OperatingHours[]) => {
    const hoursMap: Record<number, OperatingHoursFormData> = {}
    operatingHours.forEach((hour: OperatingHours) => {
      // Convert ISO time strings to HH:MM format
      let openTime = '09:00'
      let closeTime = '17:00'

      if (hour.openTime) {
        const openDate = new Date(hour.openTime)
        openTime = openDate.toTimeString().slice(0, 5)
      }

      if (hour.closeTime) {
        const closeDate = new Date(hour.closeTime)
        closeTime = closeDate.toTimeString().slice(0, 5)
      }

      hoursMap[hour.dayOfWeek] = {
        id: hour.id,
        outletId: hour.outletId,
        dayOfWeek: hour.dayOfWeek,
        openTime: openTime,
        closeTime: closeTime,
        isOpen: hour.isOpen
      }
    })
    return hoursMap
  }, [])

  // Memoize form population to prevent unnecessary re-renders
  const populateForm = useCallback((outletData: OutletDetail) => {

    setValue('name', outletData.name)
    setValue('address', outletData.address || '')
    setValue('phone', outletData.phone || '')
    setValue('description', outletData.description || '')
    setValue('status', outletData.isOpen ? 'ACTIVE' : 'INACTIVE')
    setValue('latitude', outletData.latitude)
    setValue('longitude', outletData.longitude)

    // Parse and set initial operating hours
    if (outletData.operatingHours && outletData.operatingHours.length > 0) {
      const hoursMap = parseOperatingHours(outletData.operatingHours)
      setOperatingHoursData(hoursMap)
      setInitialOperatingHours(hoursMap)
    } else {
      const emptyHours = {}
      setOperatingHoursData(emptyHours)
      setInitialOperatingHours(emptyHours)
    }

    // Reset unsaved changes flag
    setHasUnsavedChanges(false)
    setOperatingHoursChanged(false)
  }, [setValue, parseOperatingHours])

  // Populate form when outlet changes (edit mode) - optimized
  useEffect(() => {
    if (outletDetail && open && mode === 'edit') {
      populateForm(outletDetail)
    }
  }, [outletDetail?.id, open, mode, populateForm]) // Only depend on ID to prevent unnecessary re-runs

  // Reset form saat modal ditutup - memoized reset function
  const resetForm = useCallback(() => {
    reset()
    setOperatingHoursData({})
    setInitialOperatingHours({})
    setHasUnsavedChanges(false)
    setOperatingHoursChanged(false)
  }, [reset])

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open, resetForm])

  // Memoize location select handler to prevent re-creation
  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
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
        if (data.display_name) {
          // Auto-fill address with reverse geocoding result
          setValue('address', data.display_name, { shouldValidate: true })
        }
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
    }
  }, [setValue])

  // Memoize submit handler
  const onSubmit = useCallback((data: OutletFormData) => {
    mutate(data)
  }, [mutate])

  // Memoize operating hours change handler with change detection
  const handleOperatingHoursChange = useCallback((newData: Record<number, OperatingHoursFormData>) => {
    setOperatingHoursData(newData)

    // Simple approach: just mark as changed when operating hours are modified
    setOperatingHoursChanged(true)

    // Also do deep comparison for detailed tracking
    const hasChanges = !isEqual(newData, initialOperatingHours)
    setHasUnsavedChanges(hasChanges)
  }, [initialOperatingHours])

  // Watch form changes for edit mode
  const formData = watch()
  const hasFormChanges = useMemo(() => {
    if (mode === 'add') return true
    if (!outletDetail) return false

    // Compare current form data with initial outlet data
    const currentData = {
      name: formData.name || '',
      address: formData.address || '',
      phone: formData.phone || '',
      description: formData.description || '',
      status: formData.status || 'ACTIVE'
    }

    const initialData = {
      name: outletDetail.name || '',
      address: outletDetail.address || '',
      phone: outletDetail.phone || '',
      description: outletDetail.description || '',
      status: outletDetail.isOpen ? 'ACTIVE' : 'INACTIVE'
    }

    const changes = !isEqual(currentData, initialData) || !!formData.file
    return changes
  }, [mode, formData, outletDetail])

  // Check if there are unsaved changes (form or operating hours)
  const isFormValid = useMemo(() => {
    const formValid = isValid && (mode === 'add' ? !!businessId : true)
    const hasChanges = hasUnsavedChanges || hasFormChanges || operatingHoursChanged
    return formValid && hasChanges
  }, [isValid, hasUnsavedChanges, hasFormChanges, operatingHoursChanged, mode, businessId])

  return (
    <>
      <Toaster richColors position="top-center" />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] md:min-w-fit flex flex-col">
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                onOperatingHoursChange={handleOperatingHoursChange}
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
                render={({ field }) => {
                  const lat = field.value
                  const lng = watch('longitude')

                  return (
                    <MapPicker
                      latitude={lat}
                      longitude={lng}
                      onLocationChange={handleLocationSelect}
                      placeholder="Cari lokasi atau klik pada peta..."
                      className="w-full"
                    />
                  )
                }}
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
              <Button
                type="submit"
                disabled={isSubmitting || !isFormValid}
              >
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