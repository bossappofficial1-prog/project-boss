'use client';

import React, { useState, useEffect } from 'react';
import { businessApi } from '@/lib/api';

interface BankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  currentBankData?: {
    bankName?: string;
    bankAccount?: string;
    accountHolder?: string;
  };
  onSuccess: () => void;
}

export default function BankAccountModal({ 
  isOpen, 
  onClose, 
  businessId, 
  currentBankData, 
  onSuccess 
}: BankAccountModalProps) {
  const [formData, setFormData] = useState({
    bankName: '',
    bankAccount: '',
    accountHolder: ''
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

      // Set current bank data if available
      if (currentBankData) {
        setFormData({
          bankName: currentBankData.bankName || '',
          bankAccount: currentBankData.bankAccount || '',
          accountHolder: currentBankData.accountHolder || ''
        });
      }

      return () => {
        document.body.style.overflow = '';
        if (appRoot) {
          appRoot.classList.remove('modal-open');
        }
      };
    }
  }, [isOpen, currentBankData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await businessApi.updateBankAccount(businessId, formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui informasi bank');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-md" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Informasi Rekening Bank</h2>
                <p className="text-red-100 text-sm">Kelola informasi rekening untuk transaksi</p>
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

            <div className="space-y-6">
              <div className="form-group">
                <label htmlFor="bankName" className="form-label">
                  Nama Bank *
                </label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Contoh: Bank BCA, Bank Mandiri"
                />
              </div>

              <div className="form-group">
                <label htmlFor="bankAccount" className="form-label">
                  Nomor Rekening *
                </label>
                <input
                  type="text"
                  id="bankAccount"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Masukkan nomor rekening"
                />
              </div>

              <div className="form-group">
                <label htmlFor="accountHolder" className="form-label">
                  Nama Pemegang Rekening *
                </label>
                <input
                  type="text"
                  id="accountHolder"
                  name="accountHolder"
                  value={formData.accountHolder}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Nama sesuai dengan rekening bank"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Catatan Penting:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Pastikan informasi rekening benar dan sesuai dengan dokumen bank</li>
                      <li>• Rekening ini akan digunakan untuk pencairan dana transaksi</li>
                      <li>• Informasi ini dapat diubah kapan saja melalui menu pengaturan</li>
                    </ul>
                  </div>
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
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
