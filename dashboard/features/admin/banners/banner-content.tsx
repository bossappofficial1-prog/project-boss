'use client'

import React, { useEffect, useMemo, useState } from 'react';
import {
    Megaphone,
    Plus,
    Smartphone,
    X,
} from "lucide-react";
import { Button } from '@/components/ui/button';
import BannerForm, { BannerFormValues } from './banner-form';
import { Banner, useBanners, useBulkDeleteBanner, useBulkUpdateBanner, useCreateBanner, useDeleteBanner, useUpdateBanner } from '@/hooks/use-banners';
import { BannerTable } from './banner-table';
import { uploadApi } from '@/lib/api';
import { toast } from 'sonner';
import { fileToBase64 } from '@/lib/utils';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { useQueryClient } from '@tanstack/react-query';

export default function GlobalBannerContent() {
    const { data: banners, isLoading } = useBanners()
    const { mutate: createBanner, isPending: createLoading } = useCreateBanner()
    const { mutate: updateBanner, isPending: updateLoading } = useUpdateBanner()
    const { mutate: deleteBanner, isPaused: deleteLoading } = useDeleteBanner()
    const { mutateAsync: bullkDeleteBanner } = useBulkDeleteBanner()

    const queryClient = useQueryClient();
    const { mutate: bulkOrderUpdate } = useBulkUpdateBanner({
        onMutate: async ({ data }) => {
            await queryClient.cancelQueries({ queryKey: ['banners'] });
            const previous = queryClient.getQueryData<Banner[]>(['banners']);
            if (previous) {
                const orderMap = new Map(data.map(item => [item.id, item.order]));
                const optimistic = [...previous]
                    .map((banner) =>
                        orderMap.has(banner.id)
                            ? { ...banner, sortOrder: orderMap.get(banner.id)! }
                            : banner
                    )
                    .sort((a, b) => a.sortOrder - b.sortOrder);
                queryClient.setQueryData(['banners'], optimistic);
            }

            return { previous };
        },
        onError: (error: any, _, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['banners'], context.previous);
            }
            toast.error('Gagal update posisi banner.', {
                description: error?.response.data.message ?? 'Silakan coba kembali.'
            });
        }
    })

    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [selectedBannerToDelete, setSelectedBannerToDelete] = useState<Banner | null>(null)
    const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
    const [isEdit, setIsEdit] = useState(false)
    const [imageValue, setImageValue] = useState<string | File | null>(null)
    const [isActiveValue, setIsActiveValue] = useState<boolean>(false)
    const [titleValue, setTitleValue] = useState<string>('Judul')
    const [subTitleValue, setSubTitleValue] = useState<string>('Sub Judul')
    const [mode, setMode] = useState<'create' | 'edit'>('create')
    const [formKey, setFormKey] = useState(0)

    const handleValuesChange = (values: Partial<BannerFormValues>) => {
        if (values.title !== undefined) {
            setTitleValue(values.title || 'Judul')
        }

        if (values.subtitle !== undefined) {
            setSubTitleValue(values.subtitle || 'Subjudul')
        }

        if (values.isActive !== undefined) {
            setIsActiveValue(values.isActive !== 'publish')
        }

        if (values.imageUrl instanceof File) {
            handleImagePreview(values.imageUrl)
        }
    }

    const handleImagePreview = async (file: File) => {
        const previewUrl = await fileToBase64(file)
        setImageValue(previewUrl)
    }

    const handleSubmit = async (values: BannerFormValues | FormData) => {
        const formData = values as FormData
        const fileImage = formData.get('imageUrl') as File
        const payload: Partial<BannerFormValues> = {
            ctaPayload: formData.get('ctaPayload') as string ?? null,
            ctaType: formData.get('ctaType') as any ?? 'none',
            isActive: (formData.get('isActive') == 'publish') as any,
            sortOrder: Number(formData.get('sortOrder')),
            title: formData.get('title') as string,
            subtitle: formData.get('subtitle') as string
        }

        if (fileImage instanceof File) {
            const uploaded = await uploadApi.uploadImage(fileImage, { scope: 'product' })
            payload.imageUrl = uploaded.url
        }

        if (mode == 'create') {
            await createBanner(payload, {
                onSuccess: () => {
                    setSelectedBanner(null)
                    setMode('create')
                    setIsEdit(false)
                    setFormKey(prev => prev + 1)
                    toast.success('Success', {
                        description: 'Berhasil menambahkan banner baru'
                    })
                },
                onError: (error: any) => {
                    toast.error('Gagal', {
                        description: error?.response.data.message || 'Image wajib diisi'
                    })
                }
            })
        } else {
            await updateBanner({ bannerId: selectedBanner?.id!, data: payload }, {
                onSuccess: () => {
                    setSelectedBanner(null)
                    setMode('create')
                    setIsEdit(false)
                    setFormKey(prev => prev + 1)
                    toast.success('Success', {
                        description: `Berhasil update banner ${selectedBanner?.title}`
                    })
                },
                onError: (error: any) => {
                    toast.error('Gagal', {
                        description: error?.response.data.message || 'Image wajib diisi'
                    })
                }
            })
        }
    }

    const handleEdit = (banner: Banner) => {
        setSelectedBanner(banner)
        setIsEdit(true)
        setMode('edit')
        setFormKey(prev => prev + 1)
    }

    const handleDelete = (banner: Banner) => {
        setSelectedBannerToDelete(banner)
        setShowConfirmDialog(true);
    }

    const initialSortOrder = useMemo(() => {
        return (banners?.length ?? 0) + 1
    }, [])

    const defaultValues = useMemo<BannerFormValues>(() => {
        if (mode === 'create') {
            return {
                ctaType: 'none',
                isActive: 'draft',
                sortOrder: initialSortOrder,
                subtitle: '',
                title: '',
                ctaPayload: '',
                imageUrl: undefined
            }
        }

        return {
            ctaType: (selectedBanner?.ctaType ?? 'none') as "none" | "url" | "deep-link",
            isActive: selectedBanner?.isActive ? 'publish' : 'draft',
            sortOrder: selectedBanner?.sortOrder ?? 0,
            subtitle: selectedBanner?.subtitle ?? '',
            title: selectedBanner?.title ?? '',
            ctaPayload: selectedBanner?.ctaPayload ?? '',
            imageUrl: selectedBanner?.imageUrl
        }
    }, [selectedBanner, mode])

    useEffect(() => {
        if (mode !== 'edit' || !selectedBanner) return

        setTitleValue(selectedBanner.title)
        setSubTitleValue(selectedBanner.subtitle)
        setIsActiveValue(selectedBanner.isActive)
        setImageValue(selectedBanner.imageUrl)
    }, [selectedBanner, mode])

    return (
        <>
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Megaphone className="h-6 w-6 text-indigo-600" />
                        Global Banner
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Kelola banner promosi yang muncul di halaman utama User Apps.
                    </p>
                </div>
                <div className='gap-3 flex'>
                    {isEdit &&
                        <Button
                            onClick={() => {
                                setIsEdit(false)
                                setSelectedBanner(null)
                                setMode('create')
                                setFormKey(prev => prev - 1)
                            }}
                            size={`sm`}
                            className='cursor-pointer bg-yellow-500 hover:bg-yellow-700'
                        >
                            <X /> Batal
                        </Button>
                    }
                    <Button size={`sm`} onClick={() => { setMode('create'); setSelectedBanner(null); setIsEdit(false) }}>
                        <Plus className="mr-2 h-4 w-4" /> Tambah Banner
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: LIST BANNERS */}
                <div className="lg:col-span-7 space-y-4">
                    <BannerTable
                        onBulkDelete={bullkDeleteBanner}
                        onReOrder={(payload) => bulkOrderUpdate({ data: payload })}
                        data={banners || []}
                        isLoading={isLoading}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </div>

                {/* RIGHT COLUMN: EDITOR & PREVIEW */}
                <div className="lg:col-span-5 space-y-6">
                    {/* 1. EDITOR CARD */}
                    <BannerForm
                        key={formKey}
                        isLoading={createLoading || updateLoading}
                        onSubmit={handleSubmit}
                        mode={mode}
                        defaultValues={defaultValues}
                        onValuesChange={handleValuesChange}
                    />

                    {/* 2. MOBILE PREVIEW (SIMULATOR) */}
                    <div className="flex justify-center">
                        <div className="relative border-8 border-slate-800 rounded-[2.5rem] h-[500px] w-[280px] bg-white overflow-hidden shadow-2xl">
                            {/* Notch */}
                            <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-xl w-32 mx-auto z-20"></div>

                            {/* App Header Simulation */}
                            <div className="pt-8 pb-2 px-4 flex justify-between items-center bg-white z-10 sticky top-0">
                                <div className="h-8 w-8 rounded-full bg-slate-100"></div>
                                <div className="h-4 w-20 rounded bg-slate-100"></div>
                                <div className="h-6 w-6 rounded bg-slate-100"></div>
                            </div>

                            {/* App Content */}
                            <div className="p-4 space-y-4 overflow-y-auto h-full bg-slate-50">
                                {/* The Banner Preview */}
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Preview Banner</p>
                                    <div className={`rounded-xl overflow-hidden shadow-sm bg-white relative group ${isActiveValue ? 'opacity-50 grayscale' : ''}`}>
                                        <div className="aspect-video w-full bg-slate-200 relative">
                                            <img src={imageValue!} alt="preview" className="w-full h-full object-cover" />
                                            {/* Overlay Text if design requires it */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                                                <h3 className="text-white font-bold text-sm leading-tight">{titleValue ?? 'Judul'}</h3>
                                                <p className="text-white/80 text-[10px] mt-0.5 line-clamp-1">{subTitleValue ?? 'Subjudul'}</p>
                                            </div>
                                        </div>
                                        {isActiveValue && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="bg-slate-900 text-white text-xs px-2 py-1 rounded font-bold">HIDDEN</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Dummy App Content Below */}
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="aspect-square rounded-lg bg-slate-200"></div>)}
                                </div>
                                <div className="h-24 rounded-xl bg-slate-200"></div>
                                <div className="h-24 rounded-xl bg-slate-200"></div>
                            </div>

                            {/* Phone Chin */}
                            <div className="absolute bottom-1 inset-x-0 mx-auto w-24 h-1 bg-slate-800 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>

            {showConfirmDialog && selectedBannerToDelete && (
                <ConfirmationModal
                    open={showConfirmDialog}
                    onOpenChange={setShowConfirmDialog}
                    title="Konfirmasi Hapus"
                    description={`Yakin untuk menghapus banner '${selectedBannerToDelete.title}', Setelah proses selesai tidak dapat dibatalkan`}
                    onConfirm={async () => deleteBanner(selectedBannerToDelete.id, {
                        onSuccess() {
                            toast.success(`Success`, { description: `Berhasil menghapus banner ${selectedBannerToDelete.title}` });
                            setSelectedBannerToDelete(null);
                            setShowConfirmDialog(false)
                        },
                    })}
                    loading={deleteLoading}
                />
            )}
        </>
    );
}