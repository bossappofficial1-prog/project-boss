'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { productApi } from '@/lib/api'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  outletId?: string | null
  onImported?: () => void
}

export default function ImportDataModal({ open, onOpenChange, outletId, onImported }: Props) {
  const [file, setFile] = React.useState<File | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [info, setInfo] = React.useState<string | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  const reset = () => {
    setFile(null)
    setInfo(null)
    setError(null)
    setIsUploading(false)
  }

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  const handleUpload = async () => {
    if (!outletId) {
      setError('Pilih outlet terlebih dahulu.')
      return
    }
    if (!file) {
      setError('Pilih file Excel/CSV untuk diupload.')
      return
    }
    try {
      setIsUploading(true)
      setError(null)
      const result = await productApi.bulkImport(outletId, file)
      const created = result?.created ?? result?.data?.created
      const updated = result?.updated ?? result?.data?.updated
      const total = result?.total ?? result?.data?.total
      setInfo(`Import selesai. Created: ${created ?? 0}, Updated: ${updated ?? 0}, Total diproses: ${total ?? 0}.`)
      onImported?.()
    } catch (err: any) {
      setError(err?.message || 'Gagal mengunggah dan mem-preview data')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await productApi.exportTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'product_import_template.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err?.message || 'Gagal mengunduh template')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl w-[92vw]">
        <DialogHeader>
          <DialogTitle>Import Data Produk/Jasa</DialogTitle>
          <DialogDescription>Upload file Excel/CSV untuk menambah atau memperbarui data secara massal.</DialogDescription>
        </DialogHeader>

        {!outletId && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
            Pilih outlet terlebih dahulu agar dapat mengimport data.
          </div>
        )}
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-3 text-green-700 text-sm">
            {info}
          </div>
        )}

        <div className="space-y-3">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full"
          />

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Download Template
            </button>
            <button
              type="button"
              disabled={!file || !outletId || isUploading}
              onClick={handleUpload}
              className={`px-4 py-2 rounded-lg text-white ${(!file || !outletId || isUploading) ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isUploading ? 'Mengunggah...' : 'Upload'}
            </button>
            <DialogClose asChild>
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={isUploading}
              >
                Batal
              </button>
            </DialogClose>
          </div>
        </div>

        {/* With bulk import endpoint, no preview/confirm UI is needed */}
      </DialogContent>
    </Dialog>
  )
}
