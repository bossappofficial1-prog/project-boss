'use client'

import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, QrCode, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import JSZip from 'jszip'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { OutletTable } from '@/lib/apis/table'

interface TableQrDialogProps {
    table: OutletTable | null
    outletSlug?: string
    onOpenChange: (open: boolean) => void
}

/**
 * Generates a PNG data URL from an SVG element, including the table name at the bottom center.
 */
export async function generateQrImage(svgId: string, tableName: string, note?: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const svg = document.getElementById(svgId)
        if (!svg) {
            reject(new Error('SVG element not found'))
            return
        }

        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
            // Increase height to accommodate text at the bottom
            const padding = note ? 90 : 60
            canvas.width = img.width
            canvas.height = img.height + padding

            if (ctx) {
                // White background
                ctx.fillStyle = 'white'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                
                // Draw QR Code
                ctx.drawImage(img, 0, 0)

                // Draw Table Name
                ctx.fillStyle = 'black'
                ctx.font = 'bold 24px Inter, system-ui, sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(tableName, canvas.width / 2, img.height + (note ? 35 : 30))

                // Draw Note if exists
                if (note) {
                    ctx.fillStyle = '#666666'
                    ctx.font = '500 16px Inter, system-ui, sans-serif'
                    ctx.fillText(note, canvas.width / 2, img.height + 65)
                }
                
                resolve(canvas.toDataURL('image/png'))
            } else {
                reject(new Error('Canvas context not found'))
            }
        }
        img.onerror = () => reject(new Error('Failed to load SVG image'))
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    })
}

// Utility to convert image URL to Base64
async function getBase64Image(url: string): Promise<string> {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

export function TableQrDialog({ table, outletSlug, onOpenChange }: TableQrDialogProps) {
    const [logoBase64, setLogoBase64] = React.useState<string>('')

    React.useEffect(() => {
        getBase64Image('/logo.png')
            .then(setLogoBase64)
            .catch(err => console.error('Failed to load logo for QR:', err))
    }, [])

    if (!table || !outletSlug) return null

    const qrValue = `${process.env.NEXT_PUBLIC_CUSTOMER_URL}/outlet/${outletSlug}?tableId=${table.id}&tableName=${encodeURIComponent(table.name)}`

    const handleDownload = async () => {
        const id = `qr-table-code-${table.id}`
        try {
            const pngFile = await generateQrImage(id, table.name, table.note)
            const downloadLink = document.createElement('a')
            downloadLink.download = `QR-Table-${table.name}.png`
            downloadLink.href = pngFile
            downloadLink.click()
            toast.success('QR Code berhasil diunduh')
        } catch (error) {
            console.error(error)
            toast.error('Gagal mengunduh QR Code')
        }
    }

    return (
        <Dialog open={!!table} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-primary" />
                        QR Order - {table.name}
                    </DialogTitle>
                    <DialogDescription>
                        Scan QR ini untuk memesan langsung dari meja {table.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-6 space-y-4">
                    <div className="p-8 bg-white rounded-2xl shadow-sm border border-border/50 flex flex-col items-center gap-6">
                        <QRCodeSVG
                            id={`qr-table-code-${table.id}`}
                            value={qrValue}
                            size={240}
                            level="H"
                            includeMargin
                            imageSettings={logoBase64 ? {
                                src: logoBase64,
                                x: undefined,
                                y: undefined,
                                height: 40,
                                width: 40,
                                excavate: true,
                            } : undefined}
                        />
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Nomor Meja</span>
                            <span className="text-2xl font-black text-black uppercase tracking-tighter">
                                {table.name}
                            </span>
                        </div>

                        {table.note && (
                            <div className="bg-muted/50 px-4 py-2 rounded-lg border border-border/30 w-full text-center">
                                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed italic">
                                    "{table.note}"
                                </p>
                            </div>
                        )}
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground text-center uppercase tracking-widest bg-muted px-3 py-1 rounded-full">
                        {process.env.NEXT_PUBLIC_CUSTOMER_URL}/outlet/{outletSlug}?tableId={table.id.slice(0, 8)}...
                    </p>
                </div>
                <DialogFooter className="sm:justify-center flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[10px] font-black uppercase tracking-widest"
                        onClick={handleDownload}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download PNG
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 text-[10px] font-black uppercase tracking-widest"
                        onClick={() => onOpenChange(false)}
                    >
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface BulkQrDownloadProps {
    tables: OutletTable[]
    outletSlug: string
    outletName: string
    isLoading?: boolean
    onComplete?: () => void
}

export function BulkQrDownload({ tables, outletSlug, outletName, isLoading, onComplete }: BulkQrDownloadProps) {
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [logoBase64, setLogoBase64] = React.useState<string>('')

    React.useEffect(() => {
        getBase64Image('/logo.png')
            .then(setLogoBase64)
            .catch(err => console.error('Failed to load logo for QR:', err))
    }, [])

    const handleBulkDownload = async () => {
        if (tables.length === 0) {
            toast.error('Tidak ada meja untuk diunduh')
            return
        }

        setIsGenerating(true)
        const zip = new JSZip()
        const folder = zip.folder(`QR-Codes-${outletName.replace(/\s+/g, '-')}`)
        
        toast.info(`Menyiapkan ${tables.length} QR Code...`)

        try {
            // Sequential generation to avoid browser hanging
            for (const table of tables) {
                const svgId = `qr-bulk-${table.id}`
                const pngData = await generateQrImage(svgId, table.name, table.note)
                const base64Data = pngData.replace(/^data:image\/png;base64,/, "")
                folder?.file(`QR-Meja-${table.name.replace(/\s+/g, '-')}.png`, base64Data, { base64: true })
            }

            const content = await zip.generateAsync({ type: "blob" })
            const downloadLink = document.createElement('a')
            downloadLink.download = `QR-Codes-${outletName.replace(/\s+/g, '-')}.zip`
            downloadLink.href = URL.createObjectURL(content)
            downloadLink.click()
            toast.success('Semua QR Code berhasil diunduh dalam format ZIP')
            onComplete?.()
        } catch (error) {
            console.error(error)
            toast.error('Gagal mengunduh paket QR Code')
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDownload}
                disabled={isGenerating || isLoading}
                className="text-[10px] font-black uppercase tracking-widest h-9 border-primary/20 text-primary hover:bg-primary/5"
            >
                {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                    <Download className="h-4 w-4 mr-2" />
                )}
                Download Semua QR
            </Button>

            {/* Hidden render for bulk generation */}
            <div className="fixed -left-[9999px] -top-[9999px] opacity-0 pointer-events-none">
                {tables.map(table => (
                    <QRCodeSVG
                        key={table.id}
                        id={`qr-bulk-${table.id}`}
                        value={`${process.env.NEXT_PUBLIC_CUSTOMER_URL}/outlet/${outletSlug}?tableId=${table.id}&tableName=${encodeURIComponent(table.name)}`}
                        size={600} // Higher res for bulk
                        level="H"
                        includeMargin
                        imageSettings={logoBase64 ? {
                            src: logoBase64,
                            x: undefined,
                            y: undefined,
                            height: 80,
                            width: 80,
                            excavate: true,
                        } : undefined}
                    />
                ))}
            </div>
        </>
    )
}
