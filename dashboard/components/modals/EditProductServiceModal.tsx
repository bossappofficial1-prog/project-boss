'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { productApi, uploadApi } from '@/lib/api'

type Item = {
  id: string
  name: string
  description?: string
  costPrice: number
  price: number
  type: 'GOODS' | 'SERVICE'
  quantity?: number
  unit?: string
  status: 'ACTIVE' | 'INACTIVE'
  serviceDurationMinutes?: number
  image?: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item | null
  onSuccess?: () => void
}

export default function EditProductServiceModal({ open, onOpenChange, item, onSuccess }: Props) {
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [costPrice, setCostPrice] = React.useState<number | ''>('')
  const [price, setPrice] = React.useState<number | ''>('')
  const [quantity, setQuantity] = React.useState<number | ''>('')
  const [unit, setUnit] = React.useState('pcs')
  const [serviceDurationMinutes, setServiceDurationMinutes] = React.useState<number | ''>('')
  const [status, setStatus] = React.useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')
  const [imageUrl, setImageUrl] = React.useState('')
  const [file, setFile] = React.useState<File | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!item) return
    setName(item.name || '')
    setDescription(item.description || '')
    setCostPrice(item.costPrice ?? '')
    setPrice(item.price ?? '')
    setQuantity(item.quantity ?? '')
    setUnit(item.unit || 'pcs')
    setServiceDurationMinutes(item.serviceDurationMinutes ?? '')
    setStatus(item.status || 'ACTIVE')
    setImageUrl(item.image || '')
  }, [item])

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return
    if (!name.trim()) {
      setError('Nama wajib diisi.')
      return
    }
    if (price === '' || Number(price) <= 0) {
      setError('Harga jual harus lebih dari 0.')
      return
    }
    if (costPrice === '' || Number(costPrice) < 0) {
      setError('Harga modal tidak boleh negatif.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const payload: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        costPrice: Number(costPrice) || 0,
        price: Number(price),
        status,
      }
      // If a new file chosen, enforce 1MB and upload; otherwise, keep existing imageUrl if any
      let newlyUploadedUrl: string | undefined = undefined;
      if (file) {
        if (file.size > 1024 * 1024) {
          setError('Ukuran gambar melebihi 1MB.')
          setSubmitting(false)
          return
        }
        try {
          setUploading(true)
          const uploaded = await uploadApi.uploadImage(file, { scope: 'product' })
          payload.image = uploaded.url
          newlyUploadedUrl = uploaded.url
        } finally {
          setUploading(false)
        }
      } else if (imageUrl.trim()) {
        payload.image = imageUrl.trim()
      }
      if (item.type === 'GOODS') {
        payload.quantity = quantity === '' ? undefined : Number(quantity)
        payload.unit = unit || 'pcs'
      } else {
        payload.serviceDurationMinutes = serviceDurationMinutes === '' ? undefined : Number(serviceDurationMinutes)
      }

      try {
        await productApi.update(item.id, payload)
      } catch (e) {
        if (newlyUploadedUrl) {
          try {
            await uploadApi.deleteByUrl(newlyUploadedUrl)
          } catch (deleteError) {
            console.error('Failed to delete orphaned image', deleteError)
          }
        }
        throw e
      }
      onSuccess?.()
      handleClose(false)
    } catch (err: any) {
      setError(err?.message || 'Gagal memperbarui produk/jasa')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {item?.type === 'SERVICE' ? 'Jasa' : 'Produk'}</DialogTitle>
          <DialogDescription>Ubah informasi dan simpan perubahan.</DialogDescription>
        </DialogHeader>
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Tidak Aktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi (opsional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Modal</label>
              <input
                type="number"
                min={0}
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Jual</label>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {item?.type === 'GOODS' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stok</label>
                <input
                  type="number"
                  min={0}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Satuan</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durasi Layanan (menit)</label>
              <input
                type="number"
                min={0}
                value={serviceDurationMinutes}
                onChange={(e) => setServiceDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gambar (maks 1MB)</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null
                  if (f && f.size > 1024 * 1024) {
                    setError('Ukuran gambar melebihi 1MB.')
                    setFile(null)
                  } else {
                    setError(null)
                    setFile(f)
                  }
                }}
                className="block w-full text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              {uploading && <span className="text-xs text-gray-500">Uploading...</span>}
            </div>
            {imageUrl && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Preview" className="h-16 w-16 object-cover rounded" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Batal
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={submitting || uploading}
              className={`px-4 py-2 rounded-lg text-white ${submitting ? 'bg-gray-300' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {submitting ? 'Menyimpan...' : (uploading ? 'Mengunggah...' : 'Simpan Perubahan')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
