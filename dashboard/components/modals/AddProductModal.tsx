'use client';

import React, { useState, useEffect } from 'react';
import { productApi } from '@/lib/api';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  outletId: string;
  onSuccess: () => void;
}

export default function AddProductModal({ isOpen, onClose, outletId, onSuccess }: AddProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    costPrice: '',
    price: '',
    type: 'GOODS' as 'GOODS' | 'SERVICE',
    quantity: '',
    unit: 'pcs',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    serviceDurationMinutes: '',
    image: ''
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
      const productData = {
        name: formData.name,
        description: formData.description || undefined,
        costPrice: parseFloat(formData.costPrice) || 0,
        price: parseFloat(formData.price),
        type: formData.type,
        status: formData.status,
        outletId,
        ...(formData.type === 'GOODS' && {
          quantity: parseInt(formData.quantity) || 0,
          unit: formData.unit,
        }),
        ...(formData.type === 'SERVICE' && {
          serviceDurationMinutes: parseInt(formData.serviceDurationMinutes) || undefined,
        }),
        ...(formData.image && { image: formData.image }),
      };

      await productApi.create(productData);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        costPrice: '',
        price: '',
        type: 'GOODS',
        quantity: '',
        unit: 'pcs',
        status: 'ACTIVE',
        serviceDurationMinutes: '',
        image: ''
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan produk');
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

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as 'GOODS' | 'SERVICE';
    setFormData(prev => ({
      ...prev,
      type,
      quantity: type === 'GOODS' ? prev.quantity : '',
      unit: type === 'GOODS' ? prev.unit : 'pcs',
      serviceDurationMinutes: type === 'SERVICE' ? prev.serviceDurationMinutes : ''
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
              <div className="p-2 bg-white/20 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Tambah Produk/Layanan Baru</h2>
                <p className="text-red-100 text-sm">Tambahkan produk atau layanan ke inventori</p>
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
              {/* Basic Info */}
              <div className="md:col-span-2">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Nama Produk/Layanan *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="form-input"
                    placeholder="Contoh: Nasi Gudeg Special atau Cuci Mobil"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="form-group">
                  <label htmlFor="description" className="form-label">
                    Deskripsi
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="form-input form-textarea"
                    placeholder="Deskripsi produk atau layanan..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Type Selection */}
              <div>
                <div className="form-group">
                  <label htmlFor="type" className="form-label">
                    Jenis *
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleTypeChange}
                    className="form-input"
                    required
                  >
                    <option value="GOODS">Produk (Barang)</option>
                    <option value="SERVICE">Layanan (Jasa)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="form-group">
                  <label htmlFor="status" className="form-label">
                    Status *
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

              {/* Pricing */}
              <div>
                <div className="form-group">
                  <label htmlFor="costPrice" className="form-label">
                    Harga Modal
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      Rp
                    </span>
                    <input
                      type="number"
                      id="costPrice"
                      name="costPrice"
                      value={formData.costPrice}
                      onChange={handleChange}
                      className="form-input pl-10"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="form-group">
                  <label htmlFor="price" className="form-label">
                    Harga Jual *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      Rp
                    </span>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="form-input pl-10"
                      placeholder="0"
                      required
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Conditional Fields */}
              {formData.type === 'GOODS' && (
                <>
                  <div>
                    <div className="form-group">
                      <label htmlFor="quantity" className="form-label">
                        Stok Awal
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="form-group">
                      <label htmlFor="unit" className="form-label">
                        Satuan
                      </label>
                      <select
                        id="unit"
                        name="unit"
                        value={formData.unit}
                        onChange={handleChange}
                        className="form-input"
                      >
                        <option value="pcs">Pcs</option>
                        <option value="kg">Kg</option>
                        <option value="gram">Gram</option>
                        <option value="liter">Liter</option>
                        <option value="ml">Ml</option>
                        <option value="meter">Meter</option>
                        <option value="cm">Cm</option>
                        <option value="box">Box</option>
                        <option value="pack">Pack</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {formData.type === 'SERVICE' && (
                <div>
                  <div className="form-group">
                    <label htmlFor="serviceDurationMinutes" className="form-label">
                      Durasi Layanan (menit)
                    </label>
                    <input
                      type="number"
                      id="serviceDurationMinutes"
                      name="serviceDurationMinutes"
                      value={formData.serviceDurationMinutes}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="30"
                      min="1"
                    />
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <div className="form-group">
                  <label htmlFor="image" className="form-label">
                    URL Gambar (Opsional)
                  </label>
                  <input
                    type="url"
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="https://example.com/product-image.jpg"
                  />
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
                Simpan Produk
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
