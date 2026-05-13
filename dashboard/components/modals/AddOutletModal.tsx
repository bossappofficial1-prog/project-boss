'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useForm, type Path, type ControllerRenderProps } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Clock, FileText, MapPin, Phone, Store, ToggleLeft, Mail } from 'lucide-react'
import MapPicker from '@/components/ui/MapPicker'
import OperatingHoursManager from '@/components/ui/OperatingHoursManager'
import { toast } from 'sonner'
import { useUpsertOperatingHours } from '@/hooks/useOperatingHours'
import { outletManagementApi, uploadApi } from '@/lib/api'
import { useUserData } from '@/hooks/useUserData'
import type { OutletDetail, OperatingHoursFormData } from '@/types/dashboard'
import { parseOperatingHours } from '@/lib/utils'
import { AxiosError } from 'axios'
import { ReusableForm, type FormFieldConfig } from '@/components/ui/reuseable-form'
import { ACCEPTED_FILE_TYPES } from '@/constants/file-types'
import { OutletType } from '@/types'

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
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  description: z.string().optional(),
  type: z.nativeEnum(OutletType).default(OutletType.CUSTOM),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  file: z.instanceof(File).optional(),
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
  open, onOpenChange, businessId, onSuccess,
  mode = 'add', outlet
}: Props) {
  const queryClient = useQueryClient()
  const upsertMutation = useUpsertOperatingHours()
  const { data: userData } = useUserData()

  const [operatingHoursData, setOperatingHoursData] = useState<Record<number, OperatingHoursFormData>>({})

  const form = useForm<OutletFormData>({
    resolver: zodResolver(outletSchema) as any,
    mode: 'onChange',
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
      description: '',
      type: OutletType.CUSTOM,
      status: 'ACTIVE',
      latitude: undefined,
      longitude: undefined,
    },
  })

  // Pre-fill nama outlet dengan nama bisnis saat mode add
  useEffect(() => {
    if (!open || mode !== 'add') return
    const businessName = userData?.business?.name
    if (businessName && !form.getValues('name')) {
      form.setValue('name', businessName)
    }
  }, [open, mode, userData?.business?.name])

  const { data: outletDetail } = useQuery({
    queryKey: ['outlet-detail', outlet?.id],
    queryFn: () => outletManagementApi.getById(outlet!.id),
    enabled: !!outlet?.id && open && mode === 'edit',
    staleTime: 5 * 60 * 1000,
  }) as { data: OutletDetail | undefined }

  useEffect(() => {
    if (!outletDetail || !open || mode !== 'edit') return

    form.reset({
      name: outletDetail.name || '',
      address: outletDetail.address || '',
      phone: outletDetail.phone || '',
      email: outletDetail.email || '',
      description: outletDetail.description || '',
      type: outletDetail.type || OutletType.CUSTOM,
      status: outletDetail.isOpen === true ? 'ACTIVE' : 'INACTIVE',
      latitude: outletDetail.latitude || undefined,
      longitude: outletDetail.longitude || undefined,
    })

    console.log(outletDetail.isOpen)
    const hours = outletDetail.operatingHours?.length
      ? parseOperatingHours(outletDetail.operatingHours)
      : {}
    setOperatingHoursData(hours)
  }, [outletDetail?.id, open, mode])

  const handleOperatingHoursChange = useCallback(
    (data: Record<number, OperatingHoursFormData>) => setOperatingHoursData(data),
    []
  )

  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
    form.setValue('latitude', lat, { shouldValidate: true })
    form.setValue('longitude', lng, { shouldValidate: true })
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'ProjectBoss/1.0' } }
      )
      if (res.ok) {
        const data = await res.json()
        if (data.display_name) form.setValue('address', data.display_name, { shouldValidate: true })
      }
    } catch (e) {
      console.error('Reverse geocoding failed:', e)
    }
  }, [form])

  const { mutate, isPending: isSubmitting } = useMutation({
    mutationFn: async (values: any) => {
      const formData = values as FormData
      const file = formData.get('file') as File
      const status = formData.get('status') as string

      const latValue = formData.get('latitude') as string
      const lngValue = formData.get('longitude') as string

      const base = {
        name: formData.get('name') as string,
        address: formData.get('address') as string,
        phone: formData.get('phone') as string,
        email: (formData.get('email') as string) || undefined,
        description: (formData.get('description') as string) || undefined,
        type: formData.get('type') as OutletType,
        latitude: latValue && latValue !== 'undefined' ? Number(latValue) : undefined,
        longitude: lngValue && lngValue !== 'undefined' ? Number(lngValue) : undefined,
        isOpen: status === 'ACTIVE',
        image: undefined as string | undefined,
      }

      let uploadedUrl: string | undefined = undefined;

      if (file instanceof File) {
        const uploaded = await uploadApi.uploadImage(file, { scope: 'outlet' })
        uploadedUrl = uploaded.url
        base.image = uploadedUrl
      }

      let result;
      try {
        result = mode === 'edit'
          ? await outletManagementApi.update(outletDetail!.id, base)
          : await outletManagementApi.create({ ...base, businessId })
      } catch (error) {
        if (uploadedUrl) {
          try {
            await uploadApi.deleteByUrl(uploadedUrl)
          } catch (deleteError) {
            console.error('Failed to delete orphaned image:', deleteError)
          }
        }
        throw error
      }

      // Save operating hours
      const changedHours = Object.values(operatingHoursData).filter(d => d.isOpen !== undefined)
      try {
        await upsertMutation.mutateAsync({
          outletId: mode === 'edit' ? outletDetail!.id : result.id,
          hours: changedHours.map((schedule) => ({
            openTime: new Date(`1970-01-01T${schedule.openTime}:00`),
            closeTime: new Date(`1970-01-01T${schedule.closeTime}:00`),
            dayOfWeek: schedule.dayOfWeek,
            isOpen: schedule.isOpen
          }))
        })
      } catch {
        toast.warning('Outlet disimpan, tapi jam operasional gagal disimpan')
      }

      return result
    },
    onSuccess: async () => {
      toast.success(mode === 'edit' ? 'Outlet diperbarui!' : 'Outlet berhasil ditambahkan!')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['outlets'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        ...(mode === 'edit' && outletDetail?.id
          ? [queryClient.invalidateQueries({ queryKey: ['outlet-detail', outletDetail.id] })]
          : []),
      ])
      onSuccess?.()
      form.reset({
        name: '',
        address: '',
        phone: '',
        email: '',
        description: '',
        type: OutletType.CUSTOM,
        status: 'ACTIVE',
        latitude: undefined,
        longitude: undefined,
      })
      setOperatingHoursData({})
      onOpenChange(false)
    },
    onError: (e: any) => {
      toast.error(((e as AxiosError).response?.data as any)?.message || 'Gagal menyimpan outlet')
    },
  })

  const fields: FormFieldConfig<OutletFormData>[] = useMemo(() => [
    {
      name: 'name',
      label: 'Nama Outlet',
      placeholder: 'Contoh: Outlet Utama',
      icon: Building2,
      colSpan: 2 as const,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select' as const,
      placeholder: 'Pilih Status',
      icon: ToggleLeft,
      colSpan: 1 as const,
      options: [
        { label: 'Aktif', value: 'ACTIVE' },
        { label: 'Tidak Aktif', value: 'INACTIVE' },
      ],
    },
    {
      name: 'email',
      label: 'Email (Opsional)',
      type: 'email' as const,
      placeholder: 'contoh@outlet.com',
      icon: Mail,
      colSpan: 'full' as const,
    },
    {
      name: 'description',
      label: 'Deskripsi',
      type: 'textarea' as const,
      placeholder: 'Deskripsi singkat outlet',
      icon: FileText,
      colSpan: 'full' as const,
    },
    {
      name: 'type',
      label: 'Tipe Bisnis',
      type: 'select' as const,
      placeholder: 'Pilih Tipe Bisnis',
      icon: Building2,
      colSpan: 'full' as const,
      description: 'Menentukan fitur default yang paling relevan untuk operasional outlet.',
      options: [
        { label: 'F&B (Makanan & Minuman)', value: OutletType.FNB },
        { label: 'Retail (Barang/Stok)', value: OutletType.RETAIL },
        { label: 'Jasa (Layanan/Booking)', value: OutletType.SERVICE },
        { label: 'Event (Tiket/Check-in)', value: OutletType.EVENT },
        { label: 'Custom (Semua Fitur)', value: OutletType.CUSTOM },
      ],
    },
    {
      name: 'phone',
      label: 'No. Telepon',
      type: 'tel' as const,
      placeholder: '08xxxxxxxxxx',
      icon: Phone,
      colSpan: 'full' as const,
    },
    {
      name: 'latitude' as Path<OutletFormData>,
      label: '',
      type: 'custom' as const,
      colSpan: 'full' as const,
      renderCustom: () => (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
            <Clock className="h-5 w-5" /> Jam Operasional
          </h3>
          <OperatingHoursManager
            outletId={mode === 'edit' ? outletDetail?.id || '' : ''}
            operatingHoursData={operatingHoursData}
            onOperatingHoursChange={handleOperatingHoursChange}
          />
        </div>
      ),
    },
    // ── Lokasi ──
    {
      name: 'address',
      label: 'Alamat',
      placeholder: 'Alamat lengkap',
      icon: MapPin,
      colSpan: 'full' as const,
    },
    {
      name: 'longitude' as Path<OutletFormData>,
      label: '',
      type: 'custom' as const,
      colSpan: 'full' as const,
      renderCustom: ({ field }: { field: ControllerRenderProps<OutletFormData, Path<OutletFormData>> }) => (
        <MapPicker
          latitude={form.getValues('latitude')}
          longitude={field.value as number | undefined}
          onLocationChange={handleLocationSelect}
          showSelectionMarker
          showControls
          mapProps={{ projection: { type: 'globe' } }}
          renderMarkerContent={() => (
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-red-500/90 ring-2 ring-white shadow">
              <div className="h-2.5 w-2.5 rounded-full bg-white" />
            </div>
          )}
          renderMarkerPopup={(pos) => (
            <div className="text-center">
              <div className="font-semibold">{form.getValues('name') || 'Outlet'}</div>
              <div className="text-sm text-gray-600">
                Lat: {pos.lat.toFixed(6)}<br />
                Lng: {pos.lng.toFixed(6)}
              </div>
            </div>
          )}
        />
      ),
    },
    // ── Foto ──
    {
      name: 'file',
      label: 'Foto Outlet',
      type: 'file' as const,
      accept: ACCEPTED_FILE_TYPES.IMAGE,
      maxSizes: 3 * 1024 * 1024,
      colSpan: 'full' as const,
    },
  ], [mode, outletDetail, operatingHoursData, handleOperatingHoursChange, handleLocationSelect, form])

  return (
    <ReusableForm<OutletFormData>
      form={form}
      schema={outletSchema}
      fields={fields}
      defaultValues={{
        name: '',
        address: '',
        phone: '',
        email: '',
        description: '',
        type: OutletType.CUSTOM,
        status: 'ACTIVE',
        latitude: undefined,
        longitude: undefined,
      }}
      onSubmit={(values) => mutate(values)}
      isLoading={isSubmitting}
      submitDisabled={mode === 'add' && !businessId}
      submitText={mode === 'edit' ? 'Simpan Perubahan' : 'Simpan Outlet'}
      cancelText="Batal"
      gridCols={3}
      withDialog
      isDialogOpen={open}
      onDialogOpenChange={onOpenChange}
      dialogTitle={
        <span className="flex items-center gap-3 text-xl">
          <Store className="h-6 w-6 text-red-500" />
          {mode === 'edit' ? 'Edit Outlet' : 'Tambah Outlet Baru'}
        </span>
      }
      dialogDescription={
        mode === 'edit'
          ? 'Perbarui informasi outlet dan jam operasional Anda.'
          : 'Lengkapi informasi outlet dan jam operasional Anda.'
      }
      className="max-h-[95dvh] w-[95vw] max-w-250"
      confirmClose
      confirmCloseMessage="Perubahan belum disimpan. Tutup form?"
      resetFormOnClose
    />
  )
}
