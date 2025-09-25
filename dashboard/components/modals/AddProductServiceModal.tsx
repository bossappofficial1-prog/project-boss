'use client'

import React from 'react'
import ImageUploader from '@/components/ui/ImageUploader'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { productApi, uploadApi } from '@/lib/api'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  outletId?: string | null
  onSuccess?: () => void
}

export default function AddProductServiceModal({ open, onOpenChange, outletId, onSuccess }: Props) {
  const [type, setType] = React.useState<'GOODS' | 'SERVICE'>('GOODS')
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [costPrice, setCostPrice] = React.useState<number | ''>('')
  const [price, setPrice] = React.useState<number | ''>('')
  const [quantity, setQuantity] = React.useState<number | ''>('')
  const [unit, setUnit] = React.useState('pcs')
  const [serviceDurationMinutes, setServiceDurationMinutes] = React.useState<number | ''>('')
  const [status, setStatus] = React.useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')
  const [file, setFile] = React.useState<File | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const reset = () => {
    setType('GOODS')
    setName('')
    setDescription('')
    setCostPrice('')
    setPrice('')
    setQuantity('')
    setUnit('pcs')
    setServiceDurationMinutes('')
    setStatus('ACTIVE')
    setFile(null)
    setUploading(false)
    setError(null)
  }

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset()
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!outletId) {
      setError('Pilih outlet terlebih dahulu.')
      return
    }
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
        type,
        status,
        outletId,
      }
      // Require image file and enforce client-side size limit (1MB)
      if (!file) {
        setError('Gambar wajib diupload (maksimum 1MB).')
        setSubmitting(false)
        return
      }
      if (file.size > 1 * 1024 * 1024) {
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

      await productApi.create(payload)
      onSuccess?.()
      handleClose(false)
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan produk/jasa')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Produk atau Jasa</DialogTitle>
          <DialogDescription>Isi detail untuk menambahkan item baru ke outlet.</DialogDescription>
        </DialogHeader>
        {!outletId && (
          <div className="mb-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-amber-800 dark:text-amber-400 text-sm">
            Pilih outlet terlebih dahulu agar dapat menambah produk atau jasa.
          </div>
        )}
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenis</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'GOODS' | 'SERVICE')}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="GOODS">Produk (Barang)</option>
                <option value="SERVICE">Jasa (Layanan)</option>
              </select>
            </div>
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
              placeholder="Contoh: Kopi Susu Gula Aren"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi (opsional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
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

          {type === 'GOODS' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stok Awal</label>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gambar Produk (maks 1MB)</label>
            <ImageUploader onFileChange={(f) => {
              if (f && f.size > 1024 * 1024) {
                setError('Ukuran gambar melebihi 1MB.')
                setFile(null)
              } else {
                setError(null)
                setFile(f)
              }
            }} />
            {uploading && (
              <span className="text-xs text-gray-500">Uploading...</span>
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
              disabled={submitting || uploading || !outletId}
              className={`px-4 py-2 rounded-lg text-white ${submitting || !outletId ? 'bg-gray-300' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {submitting ? 'Menyimpan...' : (uploading ? 'Mengunggah...' : 'Simpan')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
