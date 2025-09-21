'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X } from 'lucide-react'
import { Button } from './button'

type ImageUploaderProps = {
    onFileChange: (file: File | null) => void
}

export default function ImageUploader({ onFileChange }: ImageUploaderProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0]
        if (selectedFile) {
            setFile(selectedFile)
            onFileChange(selectedFile)
        }
    }, [onFileChange])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpeg', '.png', '.gif', '.jpg'] },
        maxFiles: 1,
        multiple: false,
    })

    // 3. Instant Preview Logic
    useEffect(() => {
        if (!file) {
            setPreview(null)
            return
        }
        const objectUrl = URL.createObjectURL(file)
        setPreview(objectUrl)

        // Cleanup
        return () => URL.revokeObjectURL(objectUrl)
    }, [file])

    const removeFile = () => {
        setFile(null)
        setPreview(null)
        onFileChange(null)
    }

    return (
        <div className="space-y-3">
            <div
                {...getRootProps()}
                className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                    }`}
            >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {isDragActive ? 'Lepaskan gambar di sini' : 'Klik atau seret gambar ke sini'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG, GIF (Maks 1MB)</p>
            </div>

            {preview && file && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                        <img src={preview} alt="Preview" className="h-12 w-12 object-cover rounded-md" />
                        <div>
                            <p className="text-sm font-medium truncate max-w-[200px] text-gray-900 dark:text-gray-100">{file.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeFile}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    )
}