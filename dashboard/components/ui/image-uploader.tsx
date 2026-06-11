'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone, type DropzoneOptions, type FileRejection } from 'react-dropzone'
import { Upload, X, FileText, AlertCircle, Paperclip, Camera, User, Image as ImageIcon } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export type FileUploaderVariant = 'default' | 'compact' | 'avatar' | 'button'

export interface FileUploaderProps {
  value?: File | string | null
  onValueChange: (file: File | null) => void
  variant?: FileUploaderVariant
  accept?: DropzoneOptions['accept']
  maxSize?: number
  label?: string
  helperText?: string
  disabled?: boolean
}

export function FileUploader({
  value,
  onValueChange,
  variant = 'default',
  accept = {
    'image/*': ['.jpeg', '.png', '.jpg', '.gif', '.webp'],
  },
  maxSize = 5 * 1024 * 1024,
  label = 'Klik atau seret file ke sini',
  helperText,
  disabled = false,
}: FileUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0]
      if (selectedFile) {
        setError(null)
        onValueChange(selectedFile)
      }
    },
    [onValueChange]
  )

  const onDropRejected = useCallback(
    (fileRejections: FileRejection[]) => {
      const rejection = fileRejections[0]
      if (rejection.errors[0].code === 'file-too-large') {
        setError(`File terlalu besar. Maksimal ${formatFileSize(maxSize)}`)
      } else if (rejection.errors[0].code === 'file-invalid-type') {
        setError('Tipe file tidak didukung.')
      } else {
        setError(rejection.errors[0].message)
      }
    },
    [maxSize]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept,
    maxSize,
    maxFiles: 1,
    multiple: false,
    disabled,
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
    ? typeof value === 'string'
      ? value.split('/').pop() || 'File tersimpan'
      : value.name
    : ''

  const fileSize = value && typeof value !== 'string' ? formatFileSize(value.size) : null

  // Default: large dropzone area
  const renderDefault = () => (
    <div
      {...getRootProps()}
      className={cn(
        'relative rounded-lg border-2 border-dashed transition-all duration-200',
        disabled
          ? 'opacity-50 cursor-not-allowed bg-muted/50'
          : 'cursor-pointer',
        isDragActive
          ? 'border-primary bg-primary/5'
          : error
            ? 'border-destructive bg-destructive/5'
            : 'border-border hover:border-primary/40 hover:bg-muted/30'
      )}
    >
      <input {...getInputProps()} />

      {!value ? (
        <div className="flex flex-col items-center justify-center gap-3 p-6 md:p-8">
          <div
            className={cn(
              'h-12 w-12 rounded-full flex items-center justify-center transition-colors',
              isDragActive
                ? 'bg-primary/10 text-primary'
                : error
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-muted text-muted-foreground'
            )}
          >
            <Upload className="h-5 w-5" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {isDragActive ? 'Lepaskan file di sini' : label}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {helperText || `Maksimal ${formatFileSize(maxSize)}`}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 p-3 md:p-4">
          {preview ? (
            <div className="h-14 w-14 md:h-16 md:w-16 rounded-lg overflow-hidden border border-border/60 shrink-0">
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-14 w-14 md:h-16 md:w-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {fileName}
            </p>
            {fileSize && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {fileSize}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={removeFile}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )

  // Compact: inline single row
  const renderCompact = () => (
    <div
      {...getRootProps()}
      className={cn(
        'relative flex items-center gap-3 rounded-lg border transition-all duration-200',
        disabled
          ? 'opacity-50 cursor-not-allowed bg-muted/50'
          : 'cursor-pointer',
        isDragActive
          ? 'border-primary bg-primary/5'
          : error
            ? 'border-destructive bg-destructive/5'
            : 'border-border hover:border-primary/40 bg-background'
      )}
    >
      <input {...getInputProps()} />

      {!value ? (
        <div className="flex items-center gap-3 px-3 py-2.5 w-full">
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
            <Upload className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-sm text-muted-foreground truncate flex-1">
            {isDragActive ? 'Lepaskan...' : label}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-3 py-2 w-full">
          {preview ? (
            <div className="h-8 w-8 rounded-md overflow-hidden border border-border/60 shrink-0">
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          )}
          <span className="text-sm font-medium text-foreground truncate flex-1">
            {fileName}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={removeFile}
            disabled={disabled}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )

  // Avatar: circular upload
  const renderAvatar = () => (
    <div className="flex flex-col items-center gap-3">
      <div
        {...getRootProps()}
        className={cn(
          'relative group rounded-full overflow-hidden transition-all duration-200',
          'h-24 w-24 md:h-28 md:w-28',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          isDragActive
            ? 'ring-2 ring-primary ring-offset-2'
            : error
              ? 'ring-2 ring-destructive ring-offset-2'
              : 'ring-1 ring-border hover:ring-primary/40'
        )}
      >
        <input {...getInputProps()} />

        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center">
            <User className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}

        {!disabled && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Camera className="h-5 w-5 text-white mb-1" />
            <span className="text-white text-[10px] font-medium">
              {preview ? 'Ubah' : 'Upload'}
            </span>
          </div>
        )}
      </div>

      {value && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={removeFile}
        >
          <X className="h-3.5 w-3.5" />
          Hapus Foto
        </Button>
      )}
    </div>
  )

  // Button: trigger button style
  const renderButton = () => (
    <div className="inline-flex items-center gap-2">
      <div {...getRootProps()} className="inline-block">
        <input {...getInputProps()} />

        {!value ? (
          <Button type="button" variant="outline" disabled={disabled}>
            <Paperclip className="h-4 w-4" />
            {label || 'Pilih File'}
          </Button>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground truncate max-w-[150px] sm:max-w-[200px]">
              {fileName}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={removeFile}
              disabled={disabled}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className={cn(variant === 'avatar' || variant === 'button' ? 'w-auto' : 'w-full')}>
      {variant === 'default' && renderDefault()}
      {variant === 'compact' && renderCompact()}
      {variant === 'avatar' && renderAvatar()}
      {variant === 'button' && renderButton()}

      {error && (
        <div
          className={cn(
            'flex items-center gap-1.5 mt-2 text-sm text-destructive animate-in slide-in-from-top-1',
            variant === 'avatar' && 'justify-center'
          )}
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
