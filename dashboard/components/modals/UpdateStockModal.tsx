'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { productApi } from '@/lib/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: {
    id: string
    name: string
    quantity?: number
    unit?: string
  } | null
  onUpdated?: () => void
}

export default function UpdateStockModal({ open, onOpenChange, product, onUpdated }: Props) {
  const [mode, setMode] = React.useState<'add' | 'remove' | 'set'>('add')
  const [qty, setQty] = React.useState<number>(0)
  const [reason, setReason] = React.useState<string>('')
  const [notes, setNotes] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setMode('add')
      setQty(0)
      setReason('')
      setNotes('')
      setError(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    if (qty <= 0 && mode !== 'set') {
      setError('Jumlah harus lebih dari 0')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const current = product.quantity ?? 0
      const next = mode === 'set'
        ? Math.max(0, qty)
        : Math.max(0, mode === 'add' ? current + qty : current - qty)

      await productApi.update(product.id, { quantity: next })
      onUpdated?.()
      onOpenChange(false)
    } catch (err: any) {
      setError(err?.message || 'Gagal memperbarui stok')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-[92vw]">
        <DialogHeader>
          <DialogTitle>Update Stok</DialogTitle>
          <DialogDescription>
            {product ? `Produk: ${product.name}` : 'Pilih produk terlebih dahulu.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className={`px-3 py-2 rounded-lg text-center cursor-pointer border ${mode === 'add' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'}`}>
              <input type="radio" name="mode" value="add" className="hidden" checked={mode === 'add'} onChange={() => setMode('add')} />
              Tambah
            </label>
            <label className={`px-3 py-2 rounded-lg text-center cursor-pointer border ${mode === 'remove' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-700 border-gray-300'}`}>
              <input type="radio" name="mode" value="remove" className="hidden" checked={mode === 'remove'} onChange={() => setMode('remove')} />
              Kurangi
            </label>
            <label className={`px-3 py-2 rounded-lg text-center cursor-pointer border ${mode === 'set' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}>
              <input type="radio" name="mode" value="set" className="hidden" checked={mode === 'set'} onChange={() => setMode('set')} />
              Set Nilai
            </label>
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Jumlah</label>
            <input
              type="number"
              min={0}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Masukkan jumlah"
              required
            />
            {product?.unit && (
              <div className="text-xs text-gray-500 mt-1">Satuan: {product.unit}</div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Alasan (opsional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Contoh: Restock, Koreksi stok, Penyesuaian"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Catatan (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={3}
              placeholder="Catatan tambahan"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <button type="button" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50" disabled={loading}>
                Batal
              </button>
            </DialogClose>
            <button
              type="submit"
              disabled={loading || !product}
              className={`px-4 py-2 rounded-lg text-white ${loading || !product ? 'bg-gray-300' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
