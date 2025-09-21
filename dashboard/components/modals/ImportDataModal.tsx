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

type PreviewData = {
  headers: string[]
  rows: Array<Record<string, any>>
}

export default function ImportDataModal({ open, onOpenChange, outletId, onImported }: Props) {
  const [file, setFile] = React.useState<File | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [info, setInfo] = React.useState<string | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [isParsing, setIsParsing] = React.useState(false)
  const [preview, setPreview] = React.useState<PreviewData | null>(null)

  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const reset = () => {
    setFile(null)
    setInfo(null)
    setError(null)
    setIsUploading(false)
    setIsParsing(false)
    setPreview(null)
  }

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  const parseXlsxPreview = async (f: File) => {
    setIsParsing(true)
    try {
      const XLSX = await import('xlsx')
      const data = await f.arrayBuffer()
      const wb = XLSX.read(data, { type: 'array' })
      const sheetName = wb.SheetNames[0]
      const ws = wb.Sheets[sheetName]
      const json: Array<Record<string, any>> = XLSX.utils.sheet_to_json(ws, { defval: '' })
      const rows = json.slice(0, 15)
      const headers = rows.length > 0 ? Object.keys(rows[0]) : []
      setPreview({ headers, rows })
    } catch (e: any) {
      setError(e?.message || 'Gagal membaca file .xlsx untuk pratinjau')
      setPreview(null)
    } finally {
      setIsParsing(false)
    }
  }

  const onFileSelected = async (f: File | null) => {
    setError(null)
    setInfo(null)
    setPreview(null)
    setFile(f)
    if (!f) return
    const name = f.name.toLowerCase()
    const isXlsx = name.endsWith('.xlsx') || name.endsWith('.xls')
    const isZip = name.endsWith('.zip')
    if (!isXlsx && !isZip) {
      setError('Format file tidak didukung. Gunakan .xlsx (Excel) atau .zip (Excel + folder images)')
      return
    }
    if (isXlsx) await parseXlsxPreview(f)
  }

  const handleDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const f = e.dataTransfer.files?.[0]
    if (f) await onFileSelected(f)
  }

  const handleUpload = async () => {
    if (!outletId) {
      setError('Pilih outlet terlebih dahulu.')
      return
    }
    if (!file) {
      setError('Pilih file .xlsx atau .zip untuk diupload.')
      return
    }
    const name = file.name.toLowerCase()
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.zip')) {
      setError('Format file tidak didukung. Gunakan .xlsx atau .zip')
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
      setError(err?.message || 'Gagal mengunggah data import')
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

  const isZipChosen = file?.name?.toLowerCase().endsWith('.zip')
  const isXlsxChosen = file?.name?.toLowerCase().match(/\.xlsx$|\.xls$/)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl w-[96vw]">
        <DialogHeader>
          <DialogTitle>Import Data Produk & Layanan</DialogTitle>
          <DialogDescription>
            Pilih file <b>.xlsx</b> (tanpa gambar) atau <b>.zip</b> (berisi Excel + folder <code>images/</code>) untuk menambah atau memperbarui data secara massal.
          </DialogDescription>
        </DialogHeader>

        {!outletId && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
            Pilih outlet terlebih dahulu agar dapat mengimport data.
          </div>
        )}
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3 text-green-700 dark:text-green-400 text-sm">
            {info}
          </div>
        )}

        <div className="space-y-4">
          {/* Instructions */}
          <div className="rounded-md bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3 text-xs text-gray-700 dark:text-gray-300">
            <div className="font-medium mb-1">Cara Import dengan Gambar (.zip):</div>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Unduh template Excel terlebih dahulu.</li>
              <li>Isi kolom <b>Nama File Gambar</b> sesuai nama file (contoh: <i>kopi.png</i>).</li>
              <li>Masukkan semua file gambar ke folder <b>images/</b>.</li>
              <li>Jadikan <b>.zip</b> yang berisi file Excel dan folder <b>images/</b> pada level yang sama.</li>
              <li>Ukuran maksimal setiap gambar: <b>1MB</b>.</li>
            </ol>
            <div className="mt-2 text-[11px]">
              Struktur zip contoh:
              <pre className="mt-1 rounded bg-black/5 dark:bg-white/5 p-2">{`produk_import.zip
├─ data.xlsx
└─ images/
   ├─ kopi.png
   └─ jasa-cuci.jpg`}</pre>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleDrop}
            className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40"
            onClick={() => inputRef.current?.click()}
          >
            <div className="text-sm mb-2">Seret & letakkan file di sini</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">atau klik untuk memilih file .xlsx atau .zip</div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.zip"
              onChange={(e) => onFileSelected(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>

          {/* Selected file info */}
          {file && (
            <div className="rounded-md border border-gray-200 dark:border-gray-700 p-3 text-sm flex items-center justify-between">
              <div>
                <div className="font-medium">{file.name}</div>
                <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onFileSelected(null)}
                  className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={isUploading || isParsing}
                >Hapus</button>
              </div>
            </div>
          )}

          {/* Preview for xlsx */}
          {isParsing && (
            <div className="text-xs text-gray-600">Membaca file Excel untuk pratinjau…</div>
          )}
          {preview && isXlsxChosen && (
            <div>
              <div className="text-sm font-medium mb-2">Pratinjau (maks 15 baris pertama)</div>
              <div className="overflow-auto rounded border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-100 dark:bg-gray-800/60">
                    <tr>
                      {preview.headers.map((h) => (
                        <th key={h} className="px-2 py-1 text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, idx) => (
                      <tr key={idx} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800/40">
                        {preview.headers.map((h) => (
                          <td key={h} className="px-2 py-1 whitespace-nowrap">{String(row[h] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-[11px] text-gray-500 mt-1">Pastikan ada kolom <b>Nama File Gambar</b> jika ingin mengimport gambar.</div>
            </div>
          )}

          {/* Actions */}
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
              disabled={!file || !outletId || isUploading || isParsing}
              onClick={handleUpload}
              className={`px-4 py-2 rounded-lg text-white ${(!file || !outletId || isUploading || isParsing) ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isUploading ? 'Mengunggah…' : 'Upload'}
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
      </DialogContent>
    </Dialog>
  )
}
