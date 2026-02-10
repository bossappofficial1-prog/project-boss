'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { productApi } from '@/lib/api'
import { Upload, Download, FileSpreadsheet, FolderArchive, X, AlertCircle, CheckCircle2, Info } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  outletId?: string | null
  onImported?: () => void
}

type SheetPreview = {
  name: string
  headers: string[]
  rows: Array<Record<string, any>>
}

export default function ImportDataModal({ open, onOpenChange, outletId, onImported }: Props) {
  const [file, setFile] = React.useState<File | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [info, setInfo] = React.useState<string | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [isParsing, setIsParsing] = React.useState(false)
  const [sheets, setSheets] = React.useState<SheetPreview[]>([])
  const [activePreviewTab, setActivePreviewTab] = React.useState('')

  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const reset = () => {
    setFile(null)
    setInfo(null)
    setError(null)
    setIsUploading(false)
    setIsParsing(false)
    setSheets([])
    setActivePreviewTab('')
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

      const parsed: SheetPreview[] = []
      for (const sheetName of wb.SheetNames) {
        if (sheetName.startsWith('_') || sheetName === 'Panduan') continue
        const ws = wb.Sheets[sheetName]
        const json: Array<Record<string, any>> = XLSX.utils.sheet_to_json(ws, { defval: '' })
        const rows = json.slice(0, 10)
        const headers = rows.length > 0 ? Object.keys(rows[0]) : []
        if (headers.length > 0) {
          parsed.push({ name: sheetName, headers, rows })
        }
      }

      setSheets(parsed)
      if (parsed.length > 0) setActivePreviewTab(parsed[0].name)
    } catch (e: any) {
      setError(e?.message || 'Gagal membaca file Excel untuk pratinjau')
      setSheets([])
    } finally {
      setIsParsing(false)
    }
  }

  const onFileSelected = async (f: File | null) => {
    setError(null)
    setInfo(null)
    setSheets([])
    setFile(f)
    if (!f) return
    const name = f.name.toLowerCase()
    const isXlsx = name.endsWith('.xlsx') || name.endsWith('.xls')
    const isZip = name.endsWith('.zip')
    if (!isXlsx && !isZip) {
      setError('Format file tidak didukung. Gunakan .xlsx atau .zip')
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
    if (!outletId) { setError('Pilih outlet terlebih dahulu.'); return }
    if (!file) { setError('Pilih file .xlsx atau .zip untuk diupload.'); return }
    try {
      setIsUploading(true)
      setError(null)
      const result = await productApi.bulkImport(outletId, file)
      const created = result?.created ?? result?.data?.created ?? 0
      const updated = result?.updated ?? result?.data?.updated ?? 0
      const total = result?.total ?? result?.data?.total ?? 0
      setInfo(`Import selesai — ${created} baru, ${updated} diperbarui, ${total} total diproses.`)
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
      a.download = 'template_import_produk.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err?.message || 'Gagal mengunduh template')
    }
  }

  const isZipChosen = file?.name?.toLowerCase().endsWith('.zip')

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Produk & Jasa
          </DialogTitle>
          <DialogDescription>
            Upload file Excel atau ZIP untuk menambah/memperbarui data secara massal.
          </DialogDescription>
        </DialogHeader>

        {/* Alerts */}
        {!outletId && (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Pilih outlet terlebih dahulu agar dapat mengimport data.
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="shrink-0"><X className="h-4 w-4" /></button>
          </div>
        )}
        {info && (
          <div className="flex items-center gap-2 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {info}
          </div>
        )}

        <div className="space-y-4">
          {/* Template Info */}
          <div className="rounded-md border bg-muted/50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="h-4 w-4 text-muted-foreground" />
              Panduan Format Template
            </div>
            <div className="text-xs text-muted-foreground space-y-1.5">
              <p>Template memiliki <b>2 sheet</b> terpisah:</p>
              <div className="flex gap-2">
                <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400">
                  <FileSpreadsheet className="mr-1 h-3 w-3" /> Produk Barang
                </Badge>
                <Badge variant="outline" className="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-400">
                  <FileSpreadsheet className="mr-1 h-3 w-3" /> Produk Jasa
                </Badge>
              </div>
              <p>Isi data di sheet yang sesuai. Kolom <b>Nama</b> wajib diisi, kolom lain opsional.</p>
              <p>Untuk import dengan gambar, buat file <b>.zip</b> berisi Excel + folder <code className="bg-muted px-1 rounded">images/</code>.</p>
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">
                Struktur file ZIP
              </summary>
              <pre className="mt-1 rounded-md bg-muted p-2 text-muted-foreground">{`import_produk.zip
├── data.xlsx
└── images/
    ├── sampo.png
    └── potong-rambut.jpg`}</pre>
            </details>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="group rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 p-8 text-center cursor-pointer transition-colors"
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                {isZipChosen
                  ? <FolderArchive className="h-8 w-8 text-amber-500" />
                  : <FileSpreadsheet className="h-8 w-8 text-emerald-500" />
                }
                <div className="text-left">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-7 w-7 p-0"
                  onClick={(e) => { e.stopPropagation(); onFileSelected(null) }}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-8 w-8 text-muted-foreground/50 group-hover:text-primary/60 transition-colors" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Seret file ke sini atau <span className="text-primary font-medium">pilih file</span>
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">.xlsx atau .zip</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.zip"
              onChange={(e) => onFileSelected(e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>

          {/* Preview */}
          {isParsing && (
            <p className="text-xs text-muted-foreground animate-pulse">Membaca file Excel...</p>
          )}

          {sheets.length > 0 && !isZipChosen && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Pratinjau (maks 10 baris)</p>
              <Tabs value={activePreviewTab} onValueChange={setActivePreviewTab}>
                <TabsList className="h-8">
                  {sheets.map((s) => (
                    <TabsTrigger key={s.name} value={s.name} className="text-xs px-3 h-7">
                      {s.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {sheets.map((s) => (
                  <TabsContent key={s.name} value={s.name} className="mt-2">
                    <div className="overflow-auto rounded-md max-w-[460px] border max-h-60">
                      <table className="min-w-full text-xs">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            {s.headers.map((h) => (
                              <th key={h} className="px-2 py-1.5 text-left whitespace-nowrap font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {s.rows.map((row, idx) => (
                            <tr key={idx} className="border-t">
                              {s.headers.map((h) => (
                                <td key={h} className="px-2 py-1 whitespace-nowrap">{String(row[h] ?? '')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="ghost" size="sm" disabled={isUploading}>Batal</Button>
              </DialogClose>
              <Button
                size="sm"
                disabled={!file || !outletId || isUploading || isParsing}
                onClick={handleUpload}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? 'Mengunggah...' : 'Upload & Import'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
