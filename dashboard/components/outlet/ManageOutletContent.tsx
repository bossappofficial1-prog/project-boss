'use client'

import { useCallback, useEffect, useState } from 'react'
import {
    Save, X, Upload, MapPin, Phone, Clock, Image as ImageIcon,
    Store, Pencil, QrCode, Info, Globe,
    Zap,
    ShieldCheck
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
import { cn } from '@/lib/utils'

function ManageOutletSkeleton() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/40">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64 rounded-md" />
                    <Skeleton className="h-4 w-96 rounded-full opacity-50" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32 rounded-md" />
                    <Skeleton className="h-10 w-32 rounded-md" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    {/* Image & Basic Info Skeleton */}
                    <Card className="rounded-md overflow-hidden border-border/40 bg-muted/5">
                        <Skeleton className="h-56 w-full rounded-t-md" />
                        <CardContent className="p-6 space-y-4">
                            <Skeleton className="h-8 w-1/2 rounded-md" />
                            <Skeleton className="h-16 w-full rounded-md opacity-40" />
                        </CardContent>
                    </Card>

                    {/* Contact & Location Skeleton */}
                    <Card className="rounded-md border-border/40 bg-muted/5">
                        <CardHeader>
                            <Skeleton className="h-6 w-48 rounded-md" />
                            <Skeleton className="h-3 w-64 rounded-full opacity-50" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20">
                                    <Skeleton className="h-10 w-10 rounded-md shrink-0" />
                                    <div className="space-y-2 w-full">
                                        <Skeleton className="h-2 w-16 rounded-full" />
                                        <Skeleton className="h-4 w-1/2 rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    {/* QRIS Skeleton */}
                    <Card className="rounded-md border-border/40 bg-muted/5">
                        <CardHeader>
                            <Skeleton className="h-6 w-24 rounded-md" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="aspect-square w-full rounded-xl opacity-40" />
                        </CardContent>
                    </Card>

                    {/* Summary Skeleton */}
                    <Card className="rounded-md border-border/40 bg-muted/5">
                        <CardHeader>
                            <Skeleton className="h-6 w-32 rounded-md" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <Skeleton className="h-3 w-20 rounded-full" />
                                    <Skeleton className="h-4 w-16 rounded-md" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
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
            {/* Solid & Clean Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/80 bg-background -mx-6 px-6 pt-2">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-muted text-foreground flex items-center justify-center border border-border shadow-sm">
                            <Store className="h-6 w-6" />
                        </div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                                Manajemen Outlet
                            </h1>
                            <Badge variant={formData.isOpen ? 'success' : 'destructive'} className="px-3 py-0.5 rounded-md border border-current/20 text-[10px] font-black uppercase tracking-widest bg-current/5 shadow-none">
                                {formData.isOpen ? 'Buka' : 'Tutup'}
                            </Badge>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium max-w-xl">
                        Kelola identitas, profil visual, dan konfigurasi operasional outlet Anda secara terpusat.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {isEditing ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancel}
                                className="h-10 px-4 font-bold text-xs uppercase tracking-wider rounded-md border-border/60 hover:bg-muted/50 transition-all shadow-none"
                            >
                                <X className="mr-2 h-3.5 w-3.5" />
                                Batal
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => submit()}
                                disabled={isSaving}
                                className="h-10 px-6 font-bold text-xs uppercase tracking-wider rounded-md shadow-sm transition-all"
                            >
                                <Save className="mr-2 h-3.5 w-3.5" />
                                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsOperatingHoursModalOpen(true)}
                                className="h-10 px-4 font-bold text-xs uppercase tracking-wider rounded-md border-border/60 hover:bg-muted/50 transition-all shadow-none"
                            >
                                <Clock className="mr-2 h-3.5 w-3.5" />
                                Jam Operasional
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                className="h-10 px-6 font-bold text-xs uppercase tracking-wider rounded-md shadow-sm transition-all"
                            >
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                Edit Outlet
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Outlet Image & Info */}
                    <Card className="gap-0 py-0 rounded-md overflow-hidden border-border/80 bg-background shadow-sm">
                        <div className="relative h-64 overflow-hidden bg-muted group">
                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt={formData.name}
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center bg-muted/30">
                                    <Store className="h-20 w-20 text-muted-foreground/30" />
                                </div>
                            )}

                            <div className={cn(
                                "absolute inset-0 bg-black/40 transition-opacity",
                                isEditing ? "opacity-60" : "opacity-0 group-hover:opacity-20"
                            )} />

                            {isEditing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity opacity-100">
                                    <label className="cursor-pointer group/upload">
                                        <div className="flex items-center gap-2 rounded-md bg-background px-6 py-3 text-xs font-black uppercase tracking-widest shadow-xl border border-border transition-all hover:bg-muted/50">
                                            <Upload className="h-4 w-4 text-primary" />
                                            Ganti Foto Profil Outlet
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

                            {!isEditing && (
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                                    <h2 className="text-2xl font-black tracking-tight">
                                        {formData.name}
                                    </h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
                                        Outlet Profile
                                    </p>
                                </div>
                            )}
                        </div>
                        <CardContent className="p-6">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nama Outlet</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Contoh: Kedai Kopi Senja"
                                                className="h-11 rounded-md border-border/80 focus:ring-ring/20 focus:bg-muted/20"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <Label htmlFor="isOpen" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status Operasional</Label>
                                            </div>
                                            <div className="flex items-center justify-between h-11 px-4 rounded-md border border-border/80 bg-muted/20">
                                                <span className={cn(
                                                    "text-xs font-black uppercase tracking-tight",
                                                    formData.isOpen ? "text-emerald-700" : "text-rose-700"
                                                )}>
                                                    {formData.isOpen ? 'Buka' : 'Tutup Sementara'}
                                                </span>
                                                <Switch
                                                    id="isOpen"
                                                    checked={formData.isOpen ?? false}
                                                    onCheckedChange={(checked) =>
                                                        setFormData(prev => prev ? { ...prev, isOpen: checked } : null)
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Deskripsi & Bio</Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={formData.description || ''}
                                            onChange={handleInputChange}
                                            placeholder="Gambarkan suasana atau keunggulan outlet Anda..."
                                            rows={4}
                                            className="rounded-md border-border/80 focus:ring-ring/20 focus:bg-muted/20 resize-none"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-border/40 pb-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Biodata Outlet</p>
                                            <p className="text-sm font-medium leading-relaxed text-foreground/80 italic">
                                                {formData.description || 'Tidak ada deskripsi untuk outlet ini.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contact & Location */}
                    <Card className="rounded-md gap-0 border-border/80 bg-background shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-border/40 bg-muted/30">
                            <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-foreground">
                                <MapPin className="h-4 w-4 text-primary" />
                                Informasi Kontak & Lokasi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nomor Telepon Operasional</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                id="phone"
                                                name="phone"
                                                value={formData.phone || ''}
                                                onChange={handleInputChange}
                                                placeholder="08xx-xxxx-xxxx"
                                                className="pl-9 h-11 rounded-md border-border/80 focus:ring-ring/20 focus:bg-muted/20"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alamat Lengkap</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3.5 h-3.5 w-3.5 text-muted-foreground" />
                                            <Textarea
                                                id="address"
                                                name="address"
                                                value={formData.address || ''}
                                                onChange={handleInputChange}
                                                placeholder="Sebutkan jalan, nomor, dan patokan terdekat..."
                                                className="pl-9 rounded-md border-border/80 focus:ring-ring/20 focus:bg-muted/20 min-h-[80px]"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Penanda Lokasi (Peta)</Label>
                                        <div className="overflow-hidden rounded-md border border-border/80 shadow-sm">
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
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    <div className="flex items-center gap-4 rounded-md border border-border/40 bg-muted/20 p-4 group hover:border-border/80 transition-colors">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-card text-foreground border border-border shadow-sm">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 space-y-0.5">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Telepon</p>
                                            <p className="truncate text-sm font-black tracking-tight text-foreground">{formData.phone || '-'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 rounded-md border border-border/40 bg-muted/20 p-4 group hover:border-border/80 transition-colors">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-card text-foreground border border-border shadow-sm mt-0.5">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 space-y-0.5">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Alamat Fisik</p>
                                            <p className="text-sm font-bold leading-relaxed text-foreground/90">
                                                {formData.address || '-'}
                                            </p>
                                        </div>
                                    </div>

                                    {formData.latitude && formData.longitude && (
                                        <div className="flex items-center gap-4 rounded-md border border-border/40 bg-muted/20 p-4 group hover:border-border/80 transition-colors">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-card text-foreground border border-border shadow-sm">
                                                <Globe className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 space-y-0.5">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Koordinat Geografis</p>
                                                <p className="text-sm font-mono font-bold tracking-tighter text-foreground">
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
                <div className="space-y-4">
                    {/* QRIS Card */}
                    <Card className="rounded-md gap-0 border-border/80 bg-background shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-border/40 bg-muted/30">
                            <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-foreground">
                                <QrCode className="h-4 w-4 text-primary" />
                                Pembayaran QRIS
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {isEditing ? (
                                <div className="space-y-4">
                                    {qrisPreview ? (
                                        <div className="relative group overflow-hidden rounded-md border border-border/80 bg-card p-3 shadow-sm">
                                            <img
                                                src={qrisPreview}
                                                alt="QRIS"
                                                loading="lazy"
                                                className="mx-auto aspect-square w-full object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-square flex flex-col items-center justify-center rounded-md border-2 border-dashed border-border/60 bg-muted/20 text-muted-foreground">
                                            <QrCode className="h-12 w-12 mb-2 opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Belum Ada QRIS</p>
                                        </div>
                                    )}
                                    <div className="pt-2">
                                        <FileUploader
                                            onValueChange={(file) => handleImageUpload(file!, 'qris')}
                                            label="Upload QRIS Baru"
                                            accept={{ 'image/*': ['.jpeg', '.png', '.jpg'] }}
                                        />
                                    </div>
                                </div>
                            ) : qrisPreview ? (
                                <div className="space-y-4">
                                    <div className="relative overflow-hidden rounded-md border border-border/80 bg-card p-6 shadow-sm group">
                                        <img
                                            src={qrisPreview}
                                            alt="QRIS"
                                            loading="lazy"
                                            className="mx-auto aspect-square w-full object-contain"
                                        />
                                        <div className="absolute top-3 right-3">
                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[8px] font-black uppercase tracking-tighter">
                                                Terverifikasi
                                            </Badge>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-widest">
                                        Gunakan QR di atas untuk transaksi di outlet ini.
                                    </p>
                                </div>
                            ) : (
                                <div className="aspect-square flex flex-col items-center justify-center rounded-md border border-border/60 bg-muted/20 text-muted-foreground/40">
                                    <QrCode className="h-16 w-16 mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-center px-4">
                                        QRIS belum dikonfigurasi
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Ringkasan Status Card */}
                    <Card className="rounded-md gap-0 py-0 border-border/80 bg-background shadow-sm overflow-hidden">
                        <CardHeader className="border-b p-4 border-border/40 bg-muted/30">
                            <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-foreground">
                                <Zap className="h-4 w-4 text-primary" />
                                Ringkasan Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {[
                                    { label: "Status Operasional", value: formData.isOpen ? 'Buka' : 'Tutup', variant: formData.isOpen ? 'success' : 'destructive' },
                                    { label: "Kontak Telepon", value: formData.phone || '-', variant: 'outline' },
                                    { label: "Digital Payment", value: qrisPreview ? 'Tersedia' : 'Belum Ada', variant: qrisPreview ? 'success' : 'outline' },
                                    { label: "Geolokasi", value: formData.latitude && formData.longitude ? 'Tersedia' : 'Belum Set', variant: formData.latitude && formData.longitude ? 'success' : 'outline' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between group">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tight group-hover:text-foreground transition-colors">{item.label}</span>
                                        <Badge variant={item.variant as any} className="px-2 py-0 rounded-md border text-[9px] font-black uppercase tracking-tighter shadow-none">
                                            {item.value}
                                        </Badge>
                                    </div>
                                ))}

                                {formData.createdAt && (
                                    <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tight">Terdaftar Sejak</span>
                                        <span className="text-[10px] font-bold text-foreground uppercase">
                                            {new Date(formData.createdAt).toLocaleDateString('id-ID', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
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
