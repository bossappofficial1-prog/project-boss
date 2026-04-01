'use client'

import { useCallback, useEffect, useState } from 'react'
import {
    Save, X, Upload, MapPin, Phone, Clock, Image as ImageIcon,
    Store, Pencil, QrCode, Info, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
    Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'
import MapPicker from '@/components/ui/MapPicker'
import { toast } from 'sonner'
import OperatingHoursModal from '@/components/OperatingHoursModal'
import { useOutletContext } from '@/components/providers/OutletProvider'
import type { Outlet } from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { outletManagementApi, uploadApi } from '@/lib/api'
import { EmptyOutletState } from '../ui/empty-outlet'
import { FileUploader } from '../ui/ImageUploader'
import { useRouter } from 'next/navigation'
import { SectionHeader } from '../ui/section-header'

function ManageOutletSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2 space-y-3">
                    <Skeleton className="h-64 w-full rounded-md" />
                    <Skeleton className="h-48 w-full rounded-md" />
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-80 w-full rounded-md" />
                    <Skeleton className="h-32 w-full rounded-md" />
                </div>
            </div>
        </div>
    )
}

export default function ManageOutletContent() {
    const { selectedOutlet, isLoading: outletLoading } = useOutletContext()
    const queryClient = useQueryClient()
    const router = useRouter()

    const [isEditing, setIsEditing] = useState(false)
    const [isOperatingHoursModalOpen, setIsOperatingHoursModalOpen] = useState(false)
    const [formData, setFormData] = useState<Outlet | null>(null)
    const [qrisPreview, setQrisPreview] = useState<string | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    useEffect(() => {
        if (selectedOutlet) {
            setFormData(selectedOutlet)
            setQrisPreview(selectedOutlet.manualQrImageUrl || null)
            setImagePreview(selectedOutlet.image || null)
            setIsEditing(false)
            setIsOperatingHoursModalOpen(false)
        }
    }, [selectedOutlet?.id])

    const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
        if (!formData) return
        setFormData(prev => prev ? { ...prev, latitude: lat, longitude: lng } : null)

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                { headers: { 'User-Agent': 'ProjectBoss/1.0' } }
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
    }, [formData])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!formData) return
        const { name, value } = e.target
        setFormData(prev => prev ? { ...prev, [name]: value } : null)
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement> | File, type: 'outlet' | 'qris') => {
        if (!formData) return
        const file = e instanceof File ? e : e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onloadend = () => {
            const result = reader.result as string
            if (type === 'outlet') {
                setImagePreview(result)
                setFormData(prev => prev ? { ...prev, image: file as any } : null)
            } else {
                setQrisPreview(result)
                setFormData(prev => prev ? { ...prev, manualQrImageUrl: file as any } : null)
            }
        }
        reader.readAsDataURL(file)
    }

    const handleCancel = () => {
        if (selectedOutlet) {
            setFormData(selectedOutlet)
            setImagePreview(selectedOutlet.image || null)
            setQrisPreview(selectedOutlet.manualQrImageUrl || null)
        }
        setIsEditing(false)
    }

    const handleSave = async () => {
        if (!formData || !selectedOutlet) return

        let finalImageUrl: string | undefined
        let finalQrImageUrl: string | undefined

        if (formData.image && (formData.image as any) instanceof File) {
            finalImageUrl = (await uploadApi.uploadImage(formData.image as any, { scope: 'outlet' })).url
        }
        if (formData.manualQrImageUrl && (formData.manualQrImageUrl as any) instanceof File) {
            finalQrImageUrl = (await uploadApi.uploadImage(formData.manualQrImageUrl as any, { scope: 'outlet' })).url
        }

        try {
            await outletManagementApi.update(selectedOutlet.id, {
                name: formData.name,
                address: formData.address,
                phone: formData.phone,
                ...(formData.description && { description: formData.description }),
                image: finalImageUrl,
                latitude: formData.latitude,
                longitude: formData.longitude,
                isOpen: formData.isOpen,
                manualQrImageUrl: finalQrImageUrl,
            })

            setIsEditing(false)
        } catch (error) {
            if (finalImageUrl) {
                try { await uploadApi.deleteByUrl(finalImageUrl); } catch (e) { console.error('Failed to delete orphaned image', e); }
            }
            if (finalQrImageUrl) {
                try { await uploadApi.deleteByUrl(finalQrImageUrl); } catch (e) { console.error('Failed to delete orphaned QRIS image', e); }
            }
            throw error
        }
    }

    const { mutate: submit, isPending: isSaving } = useMutation({
        mutationFn: handleSave,
        onSuccess: () => {
            queryClient.resetQueries({ queryKey: ['outlets'] })
            queryClient.refetchQueries({ queryKey: ['outlets'] })
            toast.success('Outlet berhasil diperbarui')
        },
        onError: (error) => {
            toast.error(error.message || 'Gagal memperbarui outlet')
        },
    })

    if (!selectedOutlet?.id) return <EmptyOutletState onAddOutlet={() => router.push('/owner/dashboard#add-outlet')} />;
    if (outletLoading || !formData) return <ManageOutletSkeleton />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <SectionHeader
                title='Manajemen Outlet'
                description='Kelola informasi dan pengaturan outlet yang sedang aktif'
                badge={<Badge variant={formData.isOpen ? 'success' : 'destructive'}>
                    {formData.isOpen ? 'Buka' : 'Tutup'}
                </Badge>}
                actions={isEditing ? (
                    <>
                        <Button variant="outline" size="sm" onClick={handleCancel}>
                            <X className="mr-1.5 h-4 w-4" />
                            Batal
                        </Button>
                        <Button size="sm" onClick={() => submit()} disabled={isSaving}>
                            <Save className="mr-1.5 h-4 w-4" />
                            {isSaving ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsOperatingHoursModalOpen(true)}
                        >
                            <Clock className="mr-1.5 h-4 w-4" />
                            Jam Operasional
                        </Button>
                        <Button size="sm" onClick={() => setIsEditing(true)}>
                            <Pencil className="mr-1.5 h-4 w-4" />
                            Edit Outlet
                        </Button>
                    </>
                )}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-3">
                    {/* Outlet Image & Info */}
                    <Card className='pt-0'>
                        <div className="relative h-56 overflow-hidden rounded-t-md bg-muted">
                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt={formData.name}
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <Store className="h-16 w-16 text-muted-foreground/30" />
                                </div>
                            )}
                            {isEditing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                                    <label className="cursor-pointer">
                                        <div className="flex items-center gap-2 rounded-md bg-background px-4 py-2 text-sm font-medium shadow-md">
                                            <Upload className="h-4 w-4" />
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
                        <CardContent className="pt-6">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nama Outlet</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Nama outlet"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Deskripsi</Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={formData.description || ''}
                                            onChange={handleInputChange}
                                            placeholder="Deskripsi singkat outlet..."
                                            rows={3}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between rounded-md border p-3">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="isOpen" className="text-sm font-medium">Status Outlet</Label>
                                            <p className="text-xs text-muted-foreground">
                                                {formData.isOpen ? 'Outlet sedang buka' : 'Outlet sedang tutup'}
                                            </p>
                                        </div>
                                        <Switch
                                            id="isOpen"
                                            checked={formData.isOpen ?? false}
                                            onCheckedChange={(checked) =>
                                                setFormData(prev => prev ? { ...prev, isOpen: checked } : null)
                                            }
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <h2 className="text-xl font-semibold">{formData.name}</h2>
                                        {formData.description && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {formData.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contact & Location */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Info className="h-4 w-4" />
                                Informasi Kontak & Lokasi
                            </CardTitle>
                            <CardDescription>
                                Nomor telepon dan alamat outlet
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {isEditing ? (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Nomor Telepon</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="phone"
                                                name="phone"
                                                value={formData.phone || ''}
                                                onChange={handleInputChange}
                                                placeholder="08xx-xxxx-xxxx"
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Alamat</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Textarea
                                                id="address"
                                                name="address"
                                                value={formData.address || ''}
                                                onChange={handleInputChange}
                                                placeholder="Alamat lengkap outlet"
                                                className="pl-10"
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Pilih Lokasi di Peta</Label>
                                        <div className="overflow-hidden rounded-md border">
                                            <MapPicker
                                                showControls
                                                mapProps={{ projection: { type: 'globe' } }}
                                                latitude={formData.latitude || 0}
                                                longitude={formData.longitude || 0}
                                                onLocationChange={handleLocationSelect}
                                                placeholder="Cari lokasi atau klik pada peta..."
                                                className="w-full"
                                            />
                                        </div>
                                        {formData.latitude && formData.longitude && (
                                            <p className="text-xs text-muted-foreground">
                                                Koordinat: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                                            </p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 rounded-md bg-muted/50 p-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                            <Phone className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-muted-foreground">Telepon</p>
                                            <p className="truncate text-sm font-medium">{formData.phone || '-'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 rounded-md bg-muted/50 p-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                            <MapPin className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-muted-foreground">Alamat</p>
                                            <p className="text-sm font-medium leading-relaxed">
                                                {formData.address || '-'}
                                            </p>
                                        </div>
                                    </div>

                                    {formData.latitude && formData.longitude && (
                                        <div className="flex items-center gap-3 rounded-md bg-muted/50 p-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                                <Globe className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-muted-foreground">Koordinat</p>
                                                <p className="text-sm font-medium tabular-nums">
                                                    {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                    {/* QRIS Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <QrCode className="h-4 w-4" />
                                QRIS
                            </CardTitle>
                            <CardDescription>
                                QR Code untuk pembayaran digital
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isEditing ? (
                                <div className="space-y-3">
                                    {qrisPreview && (
                                        <div className="overflow-hidden rounded-md border bg-white p-2">
                                            <img
                                                src={qrisPreview}
                                                alt="QRIS"
                                                loading="lazy"
                                                className="mx-auto aspect-square w-full object-contain"
                                            />
                                        </div>
                                    )}
                                    <FileUploader
                                        onValueChange={(file) => handleImageUpload(file!, 'qris')}
                                        label="Upload QRIS baru"
                                        accept={{ 'image/*': ['.jpeg', '.png', '.jpg'] }}
                                    />
                                </div>
                            ) : qrisPreview ? (
                                <div className="overflow-hidden rounded-md border bg-white p-2">
                                    <img
                                        src={qrisPreview}
                                        alt="QRIS"
                                        loading="lazy"
                                        className="mx-auto aspect-square w-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="flex aspect-square w-full flex-col items-center justify-center rounded-md border border-dashed bg-muted/30">
                                    <QrCode className="mb-2 h-10 w-10 text-muted-foreground/40" />
                                    <p className="text-sm font-medium text-muted-foreground">Belum ada QRIS</p>
                                    <p className="text-xs text-muted-foreground/70">
                                        Edit outlet untuk menambahkan
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Store className="h-4 w-4" />
                                Ringkasan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <Badge variant={formData.isOpen ? 'success' : 'destructive'} className="text-xs">
                                        {formData.isOpen ? 'Buka' : 'Tutup'}
                                    </Badge>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Telepon</span>
                                    <span className="text-sm font-medium">{formData.phone || '-'}</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">QRIS</span>
                                    <Badge variant={qrisPreview ? 'success' : 'outline'} className="text-xs">
                                        {qrisPreview ? 'Tersedia' : 'Belum ada'}
                                    </Badge>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Lokasi</span>
                                    <Badge
                                        variant={formData.latitude && formData.longitude ? 'success' : 'outline'}
                                        className="text-xs"
                                    >
                                        {formData.latitude && formData.longitude ? 'Tersedia' : 'Belum diatur'}
                                    </Badge>
                                </div>
                                {formData.createdAt && (
                                    <>
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Dibuat</span>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help text-sm font-medium">
                                                        {new Date(formData.createdAt).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {new Date(formData.createdAt).toLocaleString('id-ID')}
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Operating Hours Modal */}
            <OperatingHoursModal
                isOpen={isOperatingHoursModalOpen}
                onClose={() => setIsOperatingHoursModalOpen(false)}
                outletId={selectedOutlet?.id || ''}
            />
        </div>
    )
}
