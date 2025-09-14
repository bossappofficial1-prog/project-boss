'use client';

import React, { useState, useEffect } from 'react';
import { businessApi } from '@/lib/api';

interface AddOutletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddOutletModal({ isOpen, onClose, onSuccess }: AddOutletModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    openingHours: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Lock body scroll and add modal class to app-root
      document.body.style.overflow = 'hidden';
      const appRoot = document.querySelector('.app-root');
      if (appRoot) {
        appRoot.classList.add('modal-open');
      }

      // Reset form when modal opens
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        description: '',
        openingHours: '',
        status: 'ACTIVE'
      });
      setError('');

      return () => {
        document.body.style.overflow = '';
        if (appRoot) {
          appRoot.classList.remove('modal-open');
        }
      };
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const outletData = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        description: formData.description || undefined,
        openingHours: formData.openingHours || undefined,
        status: formData.status
      };

      await businessApi.createOutlet(outletData);
      
      // Reset form
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        description: '',
        openingHours: '',
        status: 'ACTIVE'
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan outlet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-l">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Tambah Outlet Baru</h2>
                <p className="text-red-100 text-sm">Tambahkan cabang atau outlet baru ke bisnis Anda</p>
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
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Basic Information */}
              <div className="md:col-span-2">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Nama Outlet *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="Contoh: Toko Pusat atau Cabang Malioboro"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="form-group">
                  <label htmlFor="address" className="form-label">
                    Alamat Lengkap *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="form-input form-textarea"
                    placeholder="Masukkan alamat lengkap outlet..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="outlet@example.com"
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="md:col-span-2">
                <div className="form-group">
                  <label htmlFor="description" className="form-label">
                    Deskripsi Outlet
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="form-input form-textarea"
                    placeholder="Deskripsi singkat tentang outlet..."
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <div className="form-group">
                  <label htmlFor="openingHours" className="form-label">
                    Jam Operasional
                  </label>
                  <input
                    type="text"
                    id="openingHours"
                    name="openingHours"
                    value={formData.openingHours}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Contoh: Senin-Jumat 08:00-17:00"
                  />
                </div>
              </div>

              <div>
                <div className="form-group">
                  <label htmlFor="status" className="form-label">
                    Status Outlet *
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Tidak Aktif</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Informasi Outlet:</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Setiap outlet akan memiliki sistem inventori terpisah</li>
                    <li>• Laporan keuangan dapat dipisah per outlet</li>
                    <li>• Staff dapat ditetapkan ke outlet tertentu</li>
                    <li>• Outlet dapat dinonaktifkan sementara tanpa menghapus data</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menyimpan...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Buat Outlet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
