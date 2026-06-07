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
    maxSize = 5 * 1024 * 1024,
    label = "Klik atau seret file ke sini",
    helperText,
    disabled = false
}: FileUploaderProps) {
    const [preview, setPreview] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0]
        if (selectedFile) {
            setError(null)
            onValueChange(selectedFile)
        }
    }, [onValueChange])

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
        e.stopPropagation()
        onValueChange(null)
        setPreview(null)
        setError(null)
    }

    const fileName = value
        ? (typeof value === 'string' ? value.split('/').pop() || 'File tersimpan' : value.name)
        : ''

    const renderDefault = () => (
        <div
            {...getRootProps()}
            className={`
                relative p-6 border-2 border-dashed rounded-xl text-center transition-all duration-200
                ${disabled ? 'opacity-50 cursor-not-allowed bg-muted' : 'cursor-pointer'}
                ${isDragActive ? 'border-primary bg-primary/10' : error ? 'border-destructive bg-destructive/10' : 'border-border hover:border-primary/50 bg-background'}
            `}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center gap-2">
                {!value ? (
                    <div className="flex flex-col items-center">
                        <Upload className={`h-10 w-10 mb-3 ${error ? 'text-destructive' : 'text-muted-foreground'}`} />
                        <p className="text-sm font-semibold text-foreground">
                            {isDragActive ? 'Lepaskan file di sini' : label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 truncate flex-1">
                            {helperText || `Maksimal ${formatFileSize(maxSize)}`}
                        </p>
                    </div>
                ) : (
                    <div className="bg-muted/50 border-border flex w-full items-center gap-4 rounded-lg border p-3">
                        {preview ? (
                            <img src={preview} alt="Preview" className="h-14 w-14 object-cover rounded-md border border-border shadow-sm" />
                        ) : (
                            <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-md">
                                <FileText className="h-7 w-7" />
                            </div>
                        )}
                        <div className="flex-1 text-left overflow-hidden">
                            <p className="text-sm font-medium truncate text-foreground">{fileName}</p>
                            {typeof value !== 'string' && <p className="text-xs text-muted-foreground">{formatFileSize(value.size)}</p>}
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={removeFile}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-full"
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
                ${disabled ? 'opacity-50 cursor-not-allowed bg-muted' : 'cursor-pointer'}
                ${isDragActive ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : error ? 'border-destructive bg-destructive/10' : 'border-border hover:border-primary/50 bg-background'}
            `}
        >
            <input {...getInputProps()} />
            {!value ? (
                <>
                    <div className="bg-muted text-muted-foreground group-hover:bg-muted/80 rounded-md p-2 transition-colors">
                        <Upload className="h-4 w-4" />
                    </div>
                    <div className="text-muted-foreground flex-1 truncate text-sm">
                        {isDragActive ? 'Lepaskan...' : label}
                    </div>
                </>
            ) : (
                <>
                    {preview ? (
                        <img src={preview} alt="Preview" className="h-8 w-8 object-cover rounded shadow-sm" />
                    ) : (
                        <div className="bg-primary/10 text-primary rounded-md p-2">
                            <FileText className="h-4 w-4" />
                        </div>
                    )}
                    <div className="text-foreground flex-1 truncate text-sm font-medium">
                        {fileName}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeFile}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 mr-1 h-6 w-6"
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
                    ${isDragActive ? 'border-primary' : error ? 'border-destructive' : 'border-border hover:border-primary/40'}
                    ${!preview ? 'bg-muted/50' : 'bg-background'}
                `}
            >
                <input {...getInputProps()} />

                {preview ? (
                    <img src={preview} alt="Avatar Preview" className="h-full w-full object-cover" />
                ) : (
                    <User className={`h-10 w-10 ${error ? 'text-destructive/60' : 'text-muted-foreground/60'}`} />
                )}

                {!disabled && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Camera className="h-6 w-6 text-white mb-1" />
                        <span className="text-white text-xs font-medium">{preview ? 'Ubah' : 'Upload'}</span>
                    </div>
                )}
            </div>

            {value && !disabled && (
                <Button
                    type="button"
                    variant="ghost"
                    onClick={removeFile}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-auto px-3 py-1.5 text-xs font-medium"
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
                        className="gap-2"
                    >
                        <Paperclip className="h-4 w-4" />
                        {label || 'Pilih File'}
                    </Button>
                ) : (
                    <div className="bg-primary/10 border-primary/20 flex items-center gap-2 rounded-lg border px-3 py-1.5 shadow-sm">
                        <FileText className="text-primary h-4 w-4" />
                        <span className="text-primary text-sm font-medium max-w-37.5 truncate">
                            {fileName}
                        </span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={removeFile}
                            className="text-primary/70 hover:text-destructive hover:bg-destructive/10 ml-1 h-6 w-6"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <div className={`w-full ${variant === 'avatar' || variant === 'button' ? 'w-auto' : ''}`}>
            {variant === 'default' && renderDefault()}
            {variant === 'compact' && renderCompact()}
            {variant === 'avatar' && renderAvatar()}
            {variant === 'button' && renderButton()}

            {error && variant !== 'avatar' && (
                <div className="text-destructive mt-2 flex items-center gap-1.5 text-sm animate-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4" />
                    <p>{error}</p>
                </div>
            )}

            {error && variant === 'avatar' && (
                <div className="text-destructive mt-3 flex items-center justify-center gap-1.5 text-center text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{error}</p>
                </div>
            )}
        </div>
    )
}
