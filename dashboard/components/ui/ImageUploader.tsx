'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone, type DropzoneOptions, type FileRejection } from 'react-dropzone'
import { Upload, X, FileText, AlertCircle, Paperclip, Camera, User } from 'lucide-react'
import { Button } from './button'

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export type FileUploaderVariant = 'default' | 'compact' | 'avatar' | 'button'

export interface FileUploaderProps {
    value?: File | string | null;
    onValueChange: (file: File | null) => void;
    variant?: FileUploaderVariant;
    accept?: DropzoneOptions['accept'];
    maxSize?: number;
    label?: string;
    helperText?: string;
    disabled?: boolean;
}

export function FileUploader({
    value,
    onValueChange,
    variant = 'default',
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

    // Handle Drop Gagal
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
        if (value.type && value.type.startsWith('image/')) {
            const objectUrl = URL.createObjectURL(value)
            setPreview(objectUrl)
            return () => URL.revokeObjectURL(objectUrl)
        }
        setPreview(null)
    }, [value])

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation() // Mencegah dialog file terbuka saat klik X
        onValueChange(null)
        setPreview(null)
        setError(null)
    }

    // Nama file helper
    const fileName = value
        ? (typeof value === 'string' ? value.split('/').pop() || 'File tersimpan' : value.name)
        : ''

    const renderDefault = () => (
        <div
            {...getRootProps()}
            className={`
                relative p-6 border-2 border-dashed rounded-xl text-center transition-all duration-200
                ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}
                ${isDragActive ? 'border-blue-500 bg-blue-50' : error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400 bg-white'}
            `}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center gap-2">
                {!value ? (
                    <div className="flex flex-col items-center">
                        <Upload className={`h-10 w-10 mb-3 ${error ? 'text-red-400' : 'text-gray-400'}`} />
                        <p className="text-sm font-semibold text-gray-700">
                            {isDragActive ? 'Lepaskan file di sini' : label}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 truncate flex-1">
                            {helperText || `Maksimal ${formatFileSize(maxSize)}`}
                        </p>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 w-full p-3 bg-gray-50 rounded-lg border border-gray-100">
                        {preview ? (
                            <img src={preview} alt="Preview" className="h-14 w-14 object-cover rounded-md border border-gray-200 shadow-sm" />
                        ) : (
                            <div className="h-14 w-14 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                                <FileText className="h-7 w-7" />
                            </div>
                        )}
                        <div className="flex-1 text-left overflow-hidden">
                            <p className="text-sm font-medium truncate text-gray-900">{fileName}</p>
                            {typeof value !== 'string' && <p className="text-xs text-gray-500">{formatFileSize(value.size)}</p>}
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={removeFile}
                            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )

    const renderCompact = () => (
        <div
            {...getRootProps()}
            className={`
                relative flex items-center gap-3 p-2 border rounded-lg transition-all duration-200
                ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}
                ${isDragActive ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400 bg-white'}
            `}
        >
            <input {...getInputProps()} />
            {!value ? (
                <>
                    <div className="p-2 bg-gray-100 rounded-md text-gray-500 group-hover:bg-gray-200 transition-colors">
                        <Upload className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-sm text-gray-500 truncate">
                        {isDragActive ? 'Lepaskan...' : label}
                    </div>
                </>
            ) : (
                <>
                    {preview ? (
                        <img src={preview} alt="Preview" className="h-8 w-8 object-cover rounded shadow-sm" />
                    ) : (
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                            <FileText className="h-4 w-4" />
                        </div>
                    )}
                    <div className="flex-1 text-sm text-gray-900 font-medium truncate">
                        {fileName}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeFile}
                        className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50 mr-1"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </>
            )}
        </div>
    )

    const renderAvatar = () => (
        <div className="flex flex-col items-center gap-3">
            <div
                {...getRootProps()}
                className={`
                    relative group flex items-center justify-center h-28 w-28 rounded-full border-4 transition-all duration-200 overflow-hidden
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    ${isDragActive ? 'border-blue-500' : error ? 'border-red-500' : 'border-gray-100 hover:border-blue-200'}
                    ${!preview ? 'bg-gray-50' : 'bg-white'}
                `}
            >
                <input {...getInputProps()} />

                {/* Gambar atau Placeholder */}
                {preview ? (
                    <img src={preview} alt="Avatar Preview" className="h-full w-full object-cover" />
                ) : (
                    <User className={`h-10 w-10 ${error ? 'text-red-300' : 'text-gray-300'}`} />
                )}

                {/* Overlay saat Hover */}
                {!disabled && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Camera className="h-6 w-6 text-white mb-1" />
                        <span className="text-white text-xs font-medium">{preview ? 'Ubah' : 'Upload'}</span>
                    </div>
                )}
            </div>

            {/* Tombol Hapus */}
            {value && !disabled && (
                <Button
                    type="button"
                    variant="ghost"
                    onClick={removeFile}
                    className="text-xs text-red-500 font-medium hover:text-red-600 hover:bg-red-50 h-auto px-3 py-1.5"
                >
                    Hapus Foto
                </Button>
            )}
        </div>
    )

    const renderButton = () => (
        <div className="inline-block">
            <div {...getRootProps()} className="inline-block">
                <input {...getInputProps()} />
                {!value ? (
                    <Button
                        type="button"
                        disabled={disabled}
                        className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                    >
                        <Paperclip className="h-4 w-4" />
                        {label || 'Pilih File'}
                    </Button>
                ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900 max-w-[150px] truncate">
                            {fileName}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={removeFile}
                            className="h-6 w-6 ml-1 text-blue-400 hover:text-red-500 hover:bg-red-50"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )

    // Render berdasarkan variant
    return (
        <div className={`w-full ${variant === 'avatar' || variant === 'button' ? 'w-auto' : ''}`}>
            {variant === 'default' && renderDefault()}
            {variant === 'compact' && renderCompact()}
            {variant === 'avatar' && renderAvatar()}
            {variant === 'button' && renderButton()}



            {/* Error Message Universal */}
            {error && variant !== 'avatar' && (
                <div className="flex items-center gap-1.5 mt-2 text-sm text-red-600 animate-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                </div>
            )}

            {/* Error khusus Avatar */}
            {error && variant === 'avatar' && (
                <div className="flex justify-center items-center gap-1.5 mt-3 text-sm text-red-600 text-center">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{error}</p>
                </div>
            )}
        </div>
    )
}
