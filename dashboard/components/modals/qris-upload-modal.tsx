"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { gooeyToast } from "goey-toast";
import Image from 'next/image';
import { outletApi } from '@/lib/apis/outlet';
import { uploadApi } from '@/lib/api';

interface QRISUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outlet: {
    id: string;
    name: string;
    qrisImage?: string | null;
  } | null;
  onSuccess?: () => void;
}

export default function QRISUploadModal({
  open,
  onOpenChange,
  outlet,
  onSuccess,
}: QRISUploadModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set preview dari existing QRIS image
  useEffect(() => {
    if (open && outlet?.qrisImage) {
      setPreviewUrl(outlet.qrisImage);
    } else if (!open) {
      // Reset state saat modal ditutup
      setPreviewUrl(null);
      setSelectedFile(null);
    }
  }, [open, outlet?.qrisImage]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      gooeyToast.error('File harus berupa gambar');
      return;
    }

    // Validasi ukuran file (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      gooeyToast.error('Ukuran file maksimal 2MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!outlet || !selectedFile) {
      gooeyToast.error('Pilih file terlebih dahulu');
      return;
    }

    setIsLoading(true);

    try {
      const fileUrl = (await uploadApi.uploadImage(selectedFile)).url
      await outletApi.uploadQRIS(outlet.id, fileUrl);

      gooeyToast.success('QRIS berhasil diupload');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error uploading QRIS:', error);
      gooeyToast.error(error.message || 'Gagal mengupload QRIS');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!outlet?.qrisImage) return;

    if (!confirm('Apakah Anda yakin ingin menghapus QRIS ini?')) {
      return;
    }

    setIsDeleting(true);

    try {
      await outletApi.deleteQRIS(outlet.id);

      gooeyToast.success('QRIS berhasil dihapus');
      setPreviewUrl(null);
      setSelectedFile(null);
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error deleting QRIS:', error);
      gooeyToast.error(error.message || 'Gagal menghapus QRIS');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload QRIS</DialogTitle>
          <DialogDescription>
            Upload gambar QRIS untuk outlet <strong>{outlet?.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview Area */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
            {previewUrl ? (
              <div className="space-y-4">
                <div className="relative w-full max-w-[300px] mx-auto aspect-square">
                  <Image
                    src={previewUrl}
                    alt="QRIS Preview"
                    fill
                    className="object-contain rounded-lg"
                    unoptimized
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedFile
                    ? `File terpilih: ${selectedFile.name}`
                    : 'QRIS saat ini'}
                </p>
              </div>
            ) : (
              <div className="py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Belum ada QRIS diupload
                </p>
              </div>
            )}
          </div>

          {/* File Input (Hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleBrowseClick}
              variant="outline"
              className="w-full"
              disabled={isLoading || isDeleting}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Pilih Gambar QRIS
            </Button>

            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Format: JPG, PNG, WebP • Maksimal 2MB
            </div>
          </div>

          {/* Upload/Delete Buttons */}
          <div className="flex gap-2 pt-2">
            {selectedFile && (
              <Button
                onClick={handleUpload}
                className="flex-1"
                disabled={isLoading || isDeleting}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mengupload...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Upload QRIS
                  </>
                )}
              </Button>
            )}

            {outlet?.qrisImage && !selectedFile && (
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="flex-1"
                disabled={isLoading || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menghapus...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Hapus QRIS
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
