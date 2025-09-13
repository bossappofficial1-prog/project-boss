'use client';

import React, { useState, useEffect } from 'react';
import { productApi } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  type: 'GOODS' | 'SERVICE';
}

interface UpdateStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

export default function UpdateStockModal({ isOpen, onClose, product, onSuccess }: UpdateStockModalProps) {
  const [formData, setFormData] = useState({
    type: 'adjustment' as 'adjustment' | 'add' | 'subtract',
    quantity: '',
    reason: '',
    notes: ''
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
        type: 'adjustment',
        quantity: '',
        reason: '',
        notes: ''
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
    if (!product) return;

    setIsSubmitting(true);
    setError('');

    try {
      const quantity = parseInt(formData.quantity);
      
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error('Jumlah harus berupa angka positif');
      }

      const stockData = {
        type: formData.type,
        quantity: quantity,
        reason: formData.reason,
        notes: formData.notes || undefined
      };

      await productApi.updateStock(product.id, stockData);
      
      // Reset form
      setFormData({
        type: 'adjustment',
        quantity: '',
        reason: '',
        notes: ''
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal mengupdate stok');
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

  const getNewQuantity = () => {
    const currentQuantity = product?.quantity || 0;
    const changeQuantity = parseInt(formData.quantity) || 0;

    switch (formData.type) {
      case 'add':
        return currentQuantity + changeQuantity;
      case 'subtract':
        return Math.max(0, currentQuantity - changeQuantity);
      case 'adjustment':
        return changeQuantity;
      default:
        return currentQuantity;
    }
  };

  if (!isOpen || !product || product.type === 'SERVICE') return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-md" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Update Stok Produk</h2>
                <p className="text-red-100 text-sm">Perbarui jumlah stok barang</p>
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

            {/* Product Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Stok saat ini: <span className="font-medium">{product.quantity || 0} {product.unit}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Stok baru:</p>
                  <p className="text-lg font-bold text-gray-900">
                    {getNewQuantity()} {product.unit}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Update Type */}
              <div className="form-group">
                <label htmlFor="type" className="form-label">
                  Jenis Update *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value="adjustment">Penyesuaian Stok (Set ke jumlah tertentu)</option>
                  <option value="add">Tambah Stok (Stok masuk)</option>
                  <option value="subtract">Kurangi Stok (Stok keluar)</option>
                </select>
              </div>

              {/* Quantity */}
              <div className="form-group">
                <label htmlFor="quantity" className="form-label">
                  {formData.type === 'adjustment' ? 'Jumlah Stok Baru' : 
                   formData.type === 'add' ? 'Jumlah Tambahan' : 'Jumlah Pengurangan'} *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="form-input pr-12"
                    placeholder="0"
                    required
                    min="1"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                    {product.unit}
                  </span>
                </div>
                {formData.type === 'subtract' && (
                  <p className="text-xs text-amber-600 mt-1">
                    Stok tidak akan menjadi negatif. Minimum stok adalah 0.
                  </p>
                )}
              </div>

              {/* Reason */}
              <div className="form-group">
                <label htmlFor="reason" className="form-label">
                  Alasan *
                </label>
                <select
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className="form-input"
                  required
                >
                  <option value="">Pilih alasan...</option>
                  {formData.type === 'add' && (
                    <>
                      <option value="purchase">Pembelian barang</option>
                      <option value="return">Barang retur dari customer</option>
                      <option value="production">Hasil produksi</option>
                      <option value="correction">Koreksi stok</option>
                    </>
                  )}
                  {formData.type === 'subtract' && (
                    <>
                      <option value="sale">Penjualan</option>
                      <option value="damaged">Barang rusak</option>
                      <option value="expired">Barang kadaluarsa</option>
                      <option value="return_supplier">Retur ke supplier</option>
                      <option value="correction">Koreksi stok</option>
                    </>
                  )}
                  {formData.type === 'adjustment' && (
                    <>
                      <option value="stocktake">Stock opname</option>
                      <option value="correction">Koreksi stok</option>
                      <option value="initial">Stok awal</option>
                    </>
                  )}
                </select>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label htmlFor="notes" className="form-label">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="form-input form-textarea"
                  placeholder="Catatan tambahan mengenai perubahan stok..."
                  rows={3}
                />
              </div>

              {/* Summary */}
              {formData.quantity && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="font-medium text-blue-900 mb-2">Ringkasan Perubahan:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>Stok saat ini: <span className="font-medium">{product.quantity || 0} {product.unit}</span></p>
                    <p>
                      {formData.type === 'add' && `Ditambah: +${formData.quantity} ${product.unit}`}
                      {formData.type === 'subtract' && `Dikurangi: -${formData.quantity} ${product.unit}`}
                      {formData.type === 'adjustment' && `Disesuaikan ke: ${formData.quantity} ${product.unit}`}
                    </p>
                    <p className="font-semibold">Stok baru: {getNewQuantity()} {product.unit}</p>
                  </div>
                </div>
              )}
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
            disabled={isSubmitting || !formData.quantity || !formData.reason}
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
                Update Stok
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
