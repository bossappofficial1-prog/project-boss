'use client'

import React, { useEffect, useMemo, useState } from 'react'
import ImageUploader from '@/components/ui/ImageUploader'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { productApi, uploadApi } from '@/lib/api'
import InputCurrency from '../ui/input-currency'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Input } from '../ui/input'
import { Switch } from '../ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Product } from '@/hooks/useProducts'
import { Button } from '../ui/button'
import z from 'zod'
import { FormFieldConfig, ReusableForm } from '../ui/reuseable-form'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    outletId?: string | null
    onSuccess?: () => void
    action?: 'add' | 'edit',
    data?: Product | null
    initialData?: Partial<ProductFormValues & { image: string }>
}

const ProductStatus = z.enum([`ACTIVE`, 'INACTIVE'])
const ProductType = z.enum([`GOODS`, 'SERVICE'])

export const productSchema = z
    .object({
        type: ProductType,
        name: z.string().min(2, 'Nama produk minimal 2 karakter'),
        description: z.string().optional(),
        costPrice: z.number().min(0, 'Harga modal minimal Rp 0'),
        price: z.number().min(0, 'Harga minimal Rp 0'),
        quantity: z.number().min(1, 'Stok minimal 1').optional(),
        unit: z.string().default('pcs').optional(),
        serviceDurationMinutes: z
            .number()
            .min(10, 'Durasi layanan minimal 10 menit')
            .optional(),
        status: ProductStatus,
        file: z
            .union([
                z
                    .instanceof(File)
                    .refine(file => file.size <= 3 * 1024 * 1024, {
                        message: 'Ukuran file maksimal 3MB',
                    }),
                z.string().min(1),
            ])
            .optional(),
    })
    .superRefine((data, ctx) => {
        const isGoods = data.type === 'GOODS';

        if (isGoods && data.quantity == null) {
            ctx.addIssue({
                path: ['quantity'],
                message: 'Stok awal wajib diisi',
                code: z.ZodIssueCode.custom,
            });
            ctx.addIssue({
                path: ['unit'],
                message: 'Satuan produk wajib diisi',
                code: z.ZodIssueCode.custom,
            });
        }

        if (!isGoods && data.serviceDurationMinutes == null) {
            ctx.addIssue({
                path: ['serviceDurationMinutes'],
                message: 'Durasi layanan wajib diisi',
                code: z.ZodIssueCode.custom,
            });
        }
    });

export type ProductFormValues = z.infer<typeof productSchema>;

export default function AddOrEditProductServiceModal({ open, onOpenChange, initialData, outletId, onSuccess, action = 'edit', data }: Props) {
    const [type, setType] = React.useState<'GOODS' | 'SERVICE'>('GOODS')
    const [name, setName] = React.useState('')
    const [description, setDescription] = React.useState('')
    const [costPrice, setCostPrice] = React.useState<number | ''>(0)
    const [price, setPrice] = React.useState<number | ''>(0)
    const [quantity, setQuantity] = React.useState<number | ''>('')
    const [unit, setUnit] = React.useState('pcs')
    const [serviceDurationMinutes, setServiceDurationMinutes] = React.useState<number | ''>('')
    const [status, setStatus] = React.useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')
    const [imagePriview, setImagePreview] = useState('')
    const [file, setFile] = React.useState<File | null>(null)
    const [uploading, setUploading] = React.useState(false)
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const isEdit = action === 'edit'

    const defaultValues = useMemo(() => {
        if (isEdit) {
            const normalized = { ...initialData } as ProductFormValues
            if (initialData?.image && !normalized.file) {
                normalized.file = initialData.image
            }
            if (normalized.type === 'GOODS') {
                normalized.serviceDurationMinutes = undefined
            }
            if (normalized.type === 'SERVICE') {
                normalized.quantity = undefined
                normalized.unit = undefined
            }
            return normalized
        }

        return {
            unit: 'pcs',
            costPrice: 0,
            description: '',
            name: '',
            price: 0,
            quantity: 1,
            status: 'ACTIVE',
            type: 'GOODS'
        } as ProductFormValues

    }, [initialData, isEdit])

    const reset = React.useCallback(() => {
        setType('GOODS')
        setName('')
        setDescription('')
        setCostPrice(0)
        setPrice(0)
        setQuantity('')
        setUnit('pcs')
        setServiceDurationMinutes('')
        setStatus('ACTIVE')
        setFile(null)
        setUploading(false)
        setError(null)
        setImagePreview('')
    }, [])

    useEffect(() => {
        if (!open) return

        if (action === 'edit') {
            if (!data) {
                reset()
                return
            }

            setType(data.type)
            setName(data.name ?? '')
            setDescription(data.description ?? '')
            setStatus(data.status)
            setImagePreview(data.image ?? '')
            setCostPrice(typeof data.costPrice === 'number' ? data.costPrice : '')
            setPrice(typeof data.price === 'number' ? data.price : '')
            setQuantity(typeof data.quantity === 'number' ? data.quantity : '')
            setUnit(data.unit ?? 'pcs')
            setServiceDurationMinutes(
                typeof data.serviceDurationMinutes === 'number'
                    ? data.serviceDurationMinutes
                    : ''
            )
            setFile(null)
            return
        }
    }, [action, data, open, reset])

    const handleClose = (nextOpen: boolean) => {
        if (!nextOpen && action === 'edit') {
            reset()
        }
        onOpenChange(nextOpen)
    }

    const handleSubmit3 = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!outletId) { setError('Pilih outlet terlebih dahulu.'); return; }

        if (!name.trim()) { setError('Nama wajib diisi.'); return; }

        if (type === 'SERVICE' && serviceDurationMinutes as number < 10) { setError(`Durasi layanan minimal 10 menit`); return }

        if (price === '' || Number(price) <= 0) { setError('Harga jual harus lebih dari 0.'); return }

        if (costPrice === '' || Number(costPrice) < 0) { setError('Harga modal tidak boleh negatif.'); return }

        if (price <= costPrice) { setError('Harga jual tidak boleh kurang dari harga modal'); return; }

        try {
            setSubmitting(true)
            setError(null)

            const payload: any = {
                name: name.trim(),
                description: description.trim() || undefined,
                costPrice: Number(costPrice) || 0,
                price: Number(price),
                type,
                status,
                outletId,
            }

            if (file && file.size > 1 * 1024 * 1024) {
                setError('Ukuran gambar melebihi 1MB.')
                setSubmitting(false)
                return
            }

            // Upload image and use returned URL
            if (file) {
                try {
                    setUploading(true)
                    const uploaded = await uploadApi.uploadImage(file, { scope: 'product' })
                    payload.image = uploaded.url
                } finally {
                    setUploading(false)
                }
            }
            if (type === 'GOODS') {
                payload.quantity = Number(quantity) || 0
                payload.unit = unit || 'pcs'
            } else {
                payload.serviceDurationMinutes = Number(serviceDurationMinutes) || 0
            }

            if (action === 'add') {
                await productApi.create(payload)
            } else {
                await productApi.update(data?.id!, payload)
            }
            onSuccess?.()
            reset()
            handleClose(false)
        } catch (err: any) {
            setError(err?.message || 'Gagal menyimpan produk/jasa')
        } finally {
            setSubmitting(false)
        }
    }

    const handleSubmit = async (values: ProductFormValues | FormData) => {
        const fileEntry = (values as FormData).get('file')
        const file = fileEntry instanceof File ? fileEntry : null
        const otherValues = values as FormData

        const formType = otherValues.get('type') as ProductFormValues['type'] | null
        const payload: any = {
            name: otherValues.get('name'),
            description: otherValues.get('description') || undefined,
            costPrice: Number(otherValues.get('costPrice')) || 0,
            price: Number(otherValues.get('price')),
            type: formType,
            status: otherValues.get('status'),
            outletId,
        }

        // Upload image and use returned URL
        if (file) {
            const uploaded = await uploadApi.uploadImage(file, { scope: 'product' })
            payload.image = uploaded.url
        }
        if (formType === 'GOODS') {
            payload.quantity = Number(otherValues.get('quantity')) || 0
            payload.unit = (otherValues.get('unit') as string) || 'pcs'
        } else {
            payload.serviceDurationMinutes = Number(otherValues.get('serviceDurationMinutes')) || 0
        }

        if (action === 'add') {
            await productApi.create(payload)
        } else {
            await productApi.update(data?.id!, payload)
        }
        onSuccess?.()
        reset()
        handleClose(false)
    }

    // mulai perubahan
    const fields: FormFieldConfig<ProductFormValues>[] = [
        {
            name: 'type',
            label: 'Jenis',
            type: 'select',
            colSpan: 4,
            placeholder: 'Pilih jenis produk',
            options: [
                {
                    label: 'Produk (Barang)',
                    value: 'GOODS',
                },
                {
                    label: 'Jasa (Layanan)',
                    value: 'SERVICE',
                }
            ]
        },
        {
            name: 'status',
            label: 'Status',
            colSpan: 2,
            type: 'custom',
            renderCustom(props) {
                const status = props.field.value
                return (
                    <div className="flex items-center justify-between rounded-lg border h-11 px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200">
                        <span
                            className={`text-sm font-medium ${status === "INACTIVE" ? "text-gray-700" : "text-gray-400"
                                }`}
                        >
                            Tidak Aktif
                        </span>

                        <Switch
                            id="status"
                            checked={status === "ACTIVE"}
                            onCheckedChange={(checked) =>
                                props.field.onChange(checked ? "ACTIVE" : "INACTIVE")}
                        />

                        <span
                            className={`text-sm font-medium ${status === "ACTIVE" ? "text-emerald-600" : "text-gray-400"
                                }`}
                        >
                            Aktif
                        </span>
                    </div>
                )
            },
        },
        {
            name: 'name',
            label: 'Nama',
            type: 'text',
            colSpan: 'full',
            placeholder: 'Contoh: Kopi susu gula aren'
        },
        {
            name: 'description',
            label: 'Deskripsi (opsional)',
            type: 'textarea',
            colSpan: 'full',
            placeholder: 'Deskripsikan produk anda'
        },
        {
            name: 'costPrice',
            label: 'Harga Modal',
            type: 'currency',
            colSpan: 3,
        },
        {
            name: 'price',
            label: 'Harga Jual',
            type: 'currency',
            colSpan: 3,
        },
        {
            name: 'quantity',
            label: 'Stok Awal',
            type: 'number',
            colSpan: 3,
            condition: (values) => values.type === 'GOODS',
        },
        {
            name: 'unit',
            label: 'Satuan',
            type: 'text',
            colSpan: 3,
            condition: (values) => values.type === 'GOODS',
        },
        {
            name: 'serviceDurationMinutes',
            label: 'Durasi Layanan (menit)',
            type: 'number',
            colSpan: 'full',
            condition: (values) => values.type === 'SERVICE',
        },
        {
            name: 'file',
            label: 'Gambar Produk',
            type: 'file',
            colSpan: 'full',
            accept: { 'image/*': ['.jpeg', '.png', '.webp', '.jpg'] },
            maxSizes: 3 * 1024 * 1024
        },
    ]

    return (
        <ReusableForm
            withDialog
            gridCols={6}
            isDialogOpen={open}
            onDialogOpenChange={handleClose}
            fields={fields}
            onSubmit={handleSubmit}
            schema={productSchema}
            defaultValues={defaultValues}
        />
    )
}
