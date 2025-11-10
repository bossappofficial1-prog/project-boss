'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
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
import type { OutletDetail, OperatingHoursFormData } from '@/types/dashboard'
import { isEqual } from 'lodash'
import { parseOperatingHours } from '@/lib/utils'

const outletSchema = z.object({
  name: z.string().min(1, 'Nama outlet wajib diisi'),
  address: z.string().min(1, 'Alamat wajib diisi'),
  phone: z.string()
    .min(6, 'Nomor telepon tidak valid')
    .max(20, 'Nomor telepon tidak valid')
    .refine((v) => {
      const re = /^(?:\+62|62|0)8[1-9][0-9]{6,10}$/
      return re.test(v.replace(/\s|-/g, ''))
    }, { message: 'Masukkan nomor telepon yang valid (contoh: 081234567890 atau +6281234567890)' }),
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

export default function AddOutletModal({
  open,
  onOpenChange,
  businessId,
  onSuccess,
  mode = 'add',
  outlet
}: Props) {
  const queryClient = useQueryClient()
  const [operatingHoursData, setOperatingHoursData] = useState<Record<number, OperatingHoursFormData>>({})
  const [initialOperatingHours, setInitialOperatingHours] = useState<Record<number, OperatingHoursFormData>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [operatingHoursChanged, setOperatingHoursChanged] = useState(false)

  const form = useForm<OutletFormData>({
    resolver: zodResolver(outletSchema) as any,
    mode: 'onChange',
    defaultValues: { status: 'ACTIVE' }
  })

  const { register, handleSubmit, control, reset, formState: { errors, isValid } } = form
  const watchedFields = useWatch({
    control,
    name: ['name', 'address', 'phone', 'description', 'status', 'latitude', 'longitude', 'file']
  })

  const upsertMutation = useUpsertOperatingHours()
  const outletQueryKey = useMemo(() => ['outlet-detail', outlet?.id], [outlet?.id])

  const { data: outletDetail } = useQuery({
    queryKey: outletQueryKey,
    queryFn: () => outletManagementApi.getById(outlet!.id),
    enabled: !!outlet?.id && open && mode === 'edit',
    staleTime: 5 * 60 * 1000
  }) as { data: OutletDetail | undefined }

  const mutationFn = useCallback(async (data: OutletFormData) => {
    let outletResult: any
    if (mode === 'edit') {
      if (!outletDetail) throw new Error('Outlet tidak ditemukan')

      let imageUrl = outletDetail.image
      if (data.file) {
        const uploaded = await uploadApi.uploadImage(data.file, { scope: 'outlet' })
        imageUrl = uploaded.url
      }

      outletResult = await outletManagementApi.update(outletDetail.id, {
        name: data.name,
        address: data.address,
        phone: data.phone,
        description: data.description || undefined,
        image: imageUrl,
        latitude: data.latitude,
        longitude: data.longitude,
        isOpen: data.status === 'ACTIVE'
      })
    } else {
      if (!businessId) throw new Error('Profil bisnis belum dibuat.')

      let imageUrl: string | undefined
      if (data.file) {
        const uploaded = await uploadApi.uploadImage(data.file, { scope: 'outlet' })
        imageUrl = uploaded.url
      }

      outletResult = await outletManagementApi.create({
        name: data.name,
        address: data.address,
        phone: data.phone,
        description: data.description || undefined,
        businessId,
        image: imageUrl,
        latitude: data.latitude,
        longitude: data.longitude,
        isOpen: data.status === 'ACTIVE'
      })
    }

    const changedHours = Object.values(operatingHoursData).filter(d => d.isOpen !== undefined)
    if (changedHours.length > 0) {
      try {
        await Promise.all(changedHours.map(data =>
          upsertMutation.mutateAsync({
            outletId: mode === 'edit' ? outletDetail!.id : outletResult.id,
            dayOfWeek: data.dayOfWeek,
            openTime: new Date(`1970-01-01T${data.openTime}:00`),
            closeTime: new Date(`1970-01-01T${data.closeTime}:00`),
            isOpen: data.isOpen
          })
        ))
      } catch {
        toast.warning('Outlet disimpan, tapi jam operasional gagal disimpan')
      }
    }

    return outletResult
  }, [mode, outletDetail, businessId, operatingHoursData, upsertMutation])

  const invalidateQueries = useCallback(async (outletId?: string) => {
    const tasks = [
      queryClient.invalidateQueries({ queryKey: ['outlets'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    ]
    if (mode === 'edit' && outletId)
      tasks.push(queryClient.invalidateQueries({ queryKey: ['outlet-detail', outletId] }))
    await Promise.all(tasks)
  }, [mode, queryClient])

  const { mutate, isPending: isSubmitting } = useMutation({
    mutationFn,
    onSuccess: async (data: any) => {
      toast.success(mode === 'edit' ? 'Outlet diperbarui!' : 'Outlet berhasil ditambahkan!')
      await invalidateQueries(mode === 'edit' ? outletDetail?.id : data.id)
      onSuccess?.()
      resetForm()
      onOpenChange(false)
    },
    onError: (e: any) => toast.error(e?.message || 'Gagal menyimpan outlet')
  })

  const resetForm = useCallback(() => {
    reset()
    setOperatingHoursData({})
    setInitialOperatingHours({})
    setHasUnsavedChanges(false)
    setOperatingHoursChanged(false)
  }, [reset])

  const populateForm = useCallback((outletData: OutletDetail) => {
    reset({
      name: outletData.name,
      address: outletData.address || '',
      phone: outletData.phone || '',
      description: outletData.description || '',
      status: outletData.isOpen ? 'ACTIVE' : 'INACTIVE',
      latitude: outletData.latitude,
      longitude: outletData.longitude,
    })

    const hours = outletData.operatingHours?.length
      ? parseOperatingHours(outletData.operatingHours)
      : {}
    setOperatingHoursData(hours)
    setInitialOperatingHours(hours)
    setHasUnsavedChanges(false)
    setOperatingHoursChanged(false)
  }, [reset])

  useEffect(() => {
    if (outletDetail && open && mode === 'edit') populateForm(outletDetail)
  }, [outletDetail?.id, open, mode, populateForm])

  const handleOperatingHoursChange = useCallback((newData: Record<number, OperatingHoursFormData>) => {
    setOperatingHoursData(newData)
    const hasChanges = !isEqual(newData, initialOperatingHours)
    setOperatingHoursChanged(hasChanges)
  }, [initialOperatingHours])

  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
    form.setValue('latitude', lat, { shouldValidate: true })
    form.setValue('longitude', lng, { shouldValidate: true })
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'User-Agent': 'ProjectBoss/1.0' }
      })
      if (res.ok) {
        const data = await res.json()
        if (data.display_name) form.setValue('address', data.display_name, { shouldValidate: true })
      }
    } catch (e) { console.error('Reverse geocoding failed:', e) }
  }, [form])

  const hasFormChanges = useMemo(() => {
    if (mode === 'add') return true
    if (!outletDetail) return false

    const [name, address, phone, description, status, latitude, longitude, file] = watchedFields

    const initial = {
      name: outletDetail.name || '',
      address: outletDetail.address || '',
      phone: outletDetail.phone || '',
      description: outletDetail.description || '',
      status: outletDetail.isOpen ? 'ACTIVE' : 'INACTIVE',
      latitude: outletDetail.latitude,
      longitude: outletDetail.longitude
    }

    const current = { name, address, phone, description, status, latitude, longitude }
    return !isEqual(current, initial) || !!file
  }, [mode, watchedFields, outletDetail])

  const isFormValid = useMemo(() => {
    if (mode === 'add') return isValid && !!businessId
    return isValid && (hasFormChanges || operatingHoursChanged)
  }, [mode, isValid, hasFormChanges, operatingHoursChanged, businessId])

  return (
    <>
      <Toaster richColors position="top-center" />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Store className="h-6 w-6 text-red-500" />
              {mode === 'edit' ? 'Edit Outlet' : 'Tambah Outlet Baru'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'edit' ? 'Perbarui informasi outlet dan jam operasional Anda.' : 'Lengkapi informasi outlet dan jam operasional Anda.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(data => mutate(data as any))} className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-6 py-4">
            {!businessId && (
              <div className="flex items-start gap-3 p-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-semibold">Bisnis Belum Dibuat</p>
                  <p className="text-xs mt-1">Silakan buat profil bisnis terlebih dahulu.</p>
                </div>
              </div>
            )}

            {/* Informasi Dasar */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Informasi Dasar</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Nama Outlet</Label>
                  <Input id="name" placeholder="Contoh: Outlet Utama" {...register('name')} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Controller control={control} name="status" render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Aktif</SelectItem>
                        <SelectItem value="INACTIVE">Tidak Aktif</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea id="description" placeholder="Deskripsi singkat outlet" {...register('description')} />
              </div>
            </section>

            {/* Kontak */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Informasi Kontak</h3>
              <div>
                <Label htmlFor="phone">No. Telepon</Label>
                <Input id="phone" placeholder="08xxxxxxxxxx" {...register('phone')} />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
              </div>
            </section>

            {/* Jam Operasional */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Jam Operasional</h3>
              <OperatingHoursManager
                outletId={mode === 'edit' ? outletDetail?.id || '' : ''}
                operatingHoursData={operatingHoursData}
                onOperatingHoursChange={handleOperatingHoursChange}
              />
            </section>

            {/* Lokasi */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Lokasi</h3>
              <Label htmlFor="address">Alamat</Label>
              <Input id="address" placeholder="Alamat lengkap" {...register('address')} />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
              <Controller control={control} name="latitude" render={({ field }) => (
                <MapPicker
                  latitude={field.value}
                  longitude={form.watch('longitude')}
                  onLocationChange={handleLocationSelect}
                />
              )} />
            </section>

            {/* Media */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Media</h3>
              {mode === 'edit' && outletDetail?.image && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border">
                  <img src={outletDetail.image} alt="Outlet" className="h-12 w-12 object-cover rounded-md" />
                  <div>
                    <p className="text-sm font-medium">Gambar saat ini</p>
                    <p className="text-xs text-gray-500">Upload gambar baru untuk mengganti</p>
                  </div>
                </div>
              )}
              <Controller control={control} name="file" render={({ field }) => <ImageUploader onFileChange={field.onChange} />} />
              {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file.message}</p>}
            </section>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button>
              <Button type="submit" disabled={isSubmitting || !isFormValid}>
                {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>) : (mode === 'edit' ? 'Simpan Perubahan' : 'Simpan Outlet')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
