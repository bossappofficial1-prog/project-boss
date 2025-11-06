'use client'

import React, { useEffect, useState } from 'react'
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

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  outletId?: string | null
  onSuccess?: () => void
  action?: 'add' | 'edit',
  data?: Product | null
}

export default function AddOrEditProductServiceModal({ open, onOpenChange, outletId, onSuccess, action = 'edit', data }: Props) {
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

  const reset = React.useCallback(() => {
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

    if (action === 'add') {
      reset()
    }
  }, [action, data, open, reset])

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset()
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!outletId) { setError('Pilih outlet terlebih dahulu.'); return; }

    if (!name.trim()) { setError('Nama wajib diisi.'); return; }

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
          <DialogTitle>{action === 'add' ? `Tambah Produk atau Jasa` : `Update ${data?.type === 'GOODS' ? 'Produk' : 'Jasa'} ${data?.name}`}</DialogTitle>
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
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className='sm:col-span-3'>
              <Label htmlFor="jenis" >Jenis</Label>
              <Select
                disabled={isEdit}
                value={type}
                onValueChange={(value) => setType(value as any)}
              >
                <SelectTrigger id='jenis' className="h-11">
                  <SelectValue placeholder="Pilih Jenis" />
                </SelectTrigger>

                <SelectContent >
                  <SelectItem value='GOODS'>Produk (Barang)</SelectItem>
                  <SelectItem value='SERVICE'>Jasa (Layanan)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label
                htmlFor="status"
                className="block text-sm font-semibold text-gray-800 tracking-wide"
              >
                Status
              </Label>

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
                  onCheckedChange={(check) =>
                    check ? setStatus("ACTIVE") : setStatus("INACTIVE")
                  }
                />

                <span
                  className={`text-sm font-medium ${status === "ACTIVE" ? "text-emerald-600" : "text-gray-400"
                    }`}
                >
                  Aktif
                </span>
              </div>
            </div>

          </div>

          <div>
            <Label htmlFor='nama'>Nama</Label>
            <Input
              id='nama'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Contoh: Kopi Susu Gula Aren'
            />
          </div>

          <div>
            <Label htmlFor='deskripsi' >Deskripsi (opsional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              id='deskripsi'
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor='costPrice'>Harga Modal</Label>
              <InputCurrency
                onValueChange={(value) => setCostPrice(value)}
                value={costPrice || 0}
                id='costPrice'
              />
            </div>
            <div>
              <Label htmlFor='price'>Harga Jual</Label>
              <InputCurrency
                onValueChange={(value) => setPrice(value)}
                value={price || 0}
                id='price'
              />
            </div>
          </div>

          {type === 'GOODS' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Stok Awal</Label>
                <Input
                  type="number"
                  min={0}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Satuan</Label>
                <Input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          ) : (
            <div>
              <Label >Durasi Layanan (menit)</Label>
              <Input
                type="number"
                min={0}
                value={serviceDurationMinutes}
                onChange={(e) => setServiceDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}

          <div>
            <Label>Gambar Produk (maks 1MB)</Label>
            {imagePriview && (
              <div className="my-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePriview} alt="Preview" className="h-24 w-24 object-cover rounded" />
              </div>
            )}
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
              <Button
                type="button"
                disabled={submitting}
                variant={'outline'}
              >
                Batal
              </Button>
            </DialogClose>
            <Button
              variant={'destructive'}
              type="submit"
              disabled={submitting || uploading || !outletId}
              className={`text-white ${submitting || !outletId ? 'bg-gray-300' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {submitting ? (!isEdit ? 'Menyimpan...' : 'Mengupdate...') : (uploading ? 'Mengunggah...' : (isEdit ? 'Update' : 'Simpan'))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
