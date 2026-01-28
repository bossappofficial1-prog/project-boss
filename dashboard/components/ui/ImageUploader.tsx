'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone, type DropzoneOptions, type FileRejection } from 'react-dropzone'
import { Upload, X, FileText, AlertCircle } from 'lucide-react'
import { Button } from './button'

// Helper untuk format ukuran file
const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

type FileUploaderProps = {
    value?: File | string | null
    onValueChange: (file: File | null) => void
    accept?: DropzoneOptions['accept']
    maxSize?: number
    label?: string
    helperText?: string
    disabled?: boolean
}

export default function FileUploader({
    value,
    onValueChange,
    accept = {
        'image/*': ['.jpeg', '.png', '.jpg', '.gif'],
        'application/pdf': ['.pdf']
    },
    maxSize = 5 * 1024 * 1024, // Default 5MB
    label = "Klik atau seret file ke sini",
    helperText,
    disabled = false
}: FileUploaderProps) {
    const [preview, setPreview] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Handle Drop Berhasil
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0]
        if (selectedFile) {
            setError(null)
            onValueChange(selectedFile)
        }
    }, [onValueChange])

    // Handle Drop Gagal (File terlalu besar / tipe salah)
    const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
        const rejection = fileRejections[0]
        if (rejection.errors[0].code === 'file-too-large') {
            setError(`File terlalu besar. Maksimal ${formatFileSize(maxSize)}`)
        } else if (rejection.errors[0].code === 'file-invalid-type') {
            setError("Tipe file tidak didukung.")
        } else {
            setError(rejection.errors[0].message)
        }
    }, [maxSize])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        onDropRejected,
        accept,
        maxSize,
        maxFiles: 1,
        multiple: false,
        disabled
    })

    // Logic untuk Preview
    useEffect(() => {
        if (!value) {
            setPreview(null)
            return
        }

        if (typeof value === 'string') {
            setPreview(value)
            return
        }

        // Jika file adalah gambar, buat preview URL
        if (value.type.startsWith('image/')) {
            const objectUrl = URL.createObjectURL(value)
            setPreview(objectUrl)
            return () => URL.revokeObjectURL(objectUrl)
        }

        // Jika bukan gambar, kosongkan preview visual
        setPreview(null)
    }, [value])

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation()
        onValueChange(null)
        setPreview(null)
        setError(null)
    }

    return (
        <div className="space-y-3 w-full">
            <div
                {...getRootProps()}
                className={`
                    relative p-6 border-2 border-dashed rounded-lg text-center transition-all duration-200
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-900' : 'cursor-pointer'}
                    ${isDragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : error
                            ? 'border-red-500 bg-red-50 dark:bg-red-950/10'
                            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                    }
                `}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center justify-center gap-2">
                    {/* Icon Utama Area Dropzone */}
                    {!value ? (
                        <div className="flex flex-col items-center">
                            <Upload className={`h-8 w-8 mb-2 ${error ? 'text-red-400' : 'text-gray-400'}`} />
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                {isDragActive ? 'Lepaskan file di sini' : label}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {helperText
                                    ? helperText
                                    : `Format yang didukung: 
                                    ${Object.values(accept)
                                        .flat()
                                        .map(ext => ext.replace('.', '').toUpperCase())
                                        .join(', ')
                                    } (Maks ${formatFileSize(maxSize)})`}
                            </p>
                        </div>
                    ) : (
                        // Tampilan Ketika File Sudah Dipilih (di dalam box)
                        <div className="flex items-center gap-4 w-full p-2 max-w-[500px]">
                            {/* Preview: Gambar atau Icon File Generic */}
                            {preview ? (
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="h-16 w-16 object-cover rounded-md border border-gray-200"
                                />
                            ) : (
                                <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-md flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <FileText className="h-8 w-8" />
                                </div>
                            )}

                            <div className="flex-1 text-left overflow-hidden">
                                <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                                    {typeof value === 'string' ? (value.split('/').pop() || 'Gambar tersimpan') : value.name}
                                </p>
                                {typeof value !== 'string' && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatFileSize(value.size)}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={removeFile}
                                className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 animate-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                </div>
            )}
        </div>
    )
}
