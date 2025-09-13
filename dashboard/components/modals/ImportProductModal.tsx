'use client';

import React, { useState, useEffect } from 'react';
import { productApi } from '@/lib/api';

interface ImportProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  outletId: string;
  onSuccess: () => void;
}

export default function ImportProductModal({ isOpen, onClose, outletId, onSuccess }: ImportProductModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'success'>('upload');
  const [previewData, setPreviewData] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Lock body scroll and add modal class to app-root
      document.body.style.overflow = 'hidden';
      const appRoot = document.querySelector('.app-root');
      if (appRoot) {
        appRoot.classList.add('modal-open');
      }

      // Reset states when modal opens
      setSelectedFile(null);
      setError('');
      setStep('upload');
      setPreviewData([]);
      setUploadProgress(0);

      return () => {
        document.body.style.overflow = '';
        if (appRoot) {
          appRoot.classList.remove('modal-open');
        }
      };
    }
  }, [isOpen]);

  const downloadTemplate = () => {
    // Create template data
    const templateData = [
      {
        'Nama Produk/Layanan': 'Contoh Produk 1',
        'Deskripsi': 'Deskripsi produk contoh',
        'Jenis': 'GOODS',
        'Harga Modal': '10000',
        'Harga Jual': '15000',
        'Stok Awal': '100',
        'Satuan': 'pcs',
        'Status': 'ACTIVE',
        'Durasi Layanan (menit)': '',
        'URL Gambar': ''
      },
      {
        'Nama Produk/Layanan': 'Contoh Layanan 1',
        'Deskripsi': 'Deskripsi layanan contoh',
        'Jenis': 'SERVICE',
        'Harga Modal': '5000',
        'Harga Jual': '25000',
        'Stok Awal': '',
        'Satuan': '',
        'Status': 'ACTIVE',
        'Durasi Layanan (menit)': '60',
        'URL Gambar': ''
      }
    ];

    // Convert to CSV
    const headers = Object.keys(templateData[0]);
    const csvContent = [
      headers.join(','),
      ...templateData.map(row => 
        headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(',')
      )
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template-import-produk.csv';
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
        setError('Format file tidak valid. Gunakan file CSV atau Excel (.xlsx, .xls)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file terlalu besar. Maksimal 5MB');
        return;
      }

      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('outletId', outletId);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file and get preview
      const response = await productApi.uploadImport(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setPreviewData(response.data || []);
      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Gagal mengupload file');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleConfirmImport = async () => {
    setIsUploading(true);
    setError('');

    try {
      await productApi.confirmImport({ outletId, data: previewData });
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Gagal mengimpor data');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Import Data Produk</h2>
                <p className="text-red-100 text-sm">
                  {step === 'upload' && 'Upload file Excel atau CSV untuk import data'}
                  {step === 'preview' && 'Preview data yang akan diimport'}
                  {step === 'success' && 'Import berhasil dilakukan'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-4">
              {/* Download Template */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">Download Template</h3>
                    <p className="text-blue-700 text-sm mb-3">
                      Download template Excel terlebih dahulu untuk memastikan format data yang benar.
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="max-w-md mx-auto">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  
                  {selectedFile ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-green-900">{selectedFile.name}</p>
                            <p className="text-sm text-green-700">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Ganti File
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Upload File Import</h3>
                        <p className="text-gray-600 text-sm">
                          Pilih file Excel (.xlsx, .xls) atau CSV untuk diupload
                        </p>
                      </div>
                      
                      <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Pilih File
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                        />
                      </label>
                      
                      <p className="text-xs text-gray-500">
                        Maksimal ukuran file 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Mengupload file...</span>
                    <span className="text-gray-900 font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium text-gray-900 mb-2">Petunjuk Import:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Download template terlebih dahulu untuk melihat format yang benar</li>
                  <li>• Pastikan kolom sesuai dengan template yang disediakan</li>
                  <li>• Jenis produk: GOODS untuk barang, SERVICE untuk layanan</li>
                  <li>• Status: ACTIVE atau INACTIVE</li>
                  <li>• Untuk layanan, kosongkan kolom Stok Awal dan Satuan</li>
                  <li>• Untuk barang, kosongkan kolom Durasi Layanan</li>
                </ul>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-blue-800 font-medium">
                  Ditemukan {previewData.length} produk/layanan yang akan diimport. 
                  Silakan review data berikut sebelum melanjutkan.
                </p>
              </div>

              <div className="max-h-80 overflow-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-900 border-b">Nama</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900 border-b">Jenis</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900 border-b">Harga</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900 border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            {item.description && (
                              <p className="text-gray-600 text-xs">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.type === 'GOODS' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.type === 'GOODS' ? 'Barang' : 'Layanan'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">Rp {item.price?.toLocaleString()}</p>
                          {item.costPrice && (
                            <p className="text-gray-600 text-xs">Modal: Rp {item.costPrice?.toLocaleString()}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Import Berhasil!</h3>
              <p className="text-gray-600 mb-6">
                {previewData.length} produk/layanan telah berhasil diimport ke sistem.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {step === 'upload' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="btn-primary"
              >
                {isUploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengupload...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Upload & Preview
                  </>
                )}
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="btn-secondary"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isUploading}
                className="btn-primary"
              >
                {isUploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengimport...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Konfirmasi Import
                  </>
                )}
              </button>
            </>
          )}

          {step === 'success' && (
            <button
              type="button"
              onClick={handleFinish}
              className="btn-primary w-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Selesai
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
