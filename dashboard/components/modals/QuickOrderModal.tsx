"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { orderApi, type CreateOrderRequest } from '@/lib/apis/order';
import { productApi } from '@/lib/apis/product';
import { outletApi, type BusinessHours } from '@/lib/apis/outlet';

interface Product {
  id: string;
  name: string;
  type: 'GOODS' | 'SERVICE';
  price: number;
  quantity?: number;
}

interface QuickOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId: string;
  productType: 'GOODS' | 'SERVICE';
  onSuccess?: () => void;
}

export function QuickOrderModal({
  open,
  onOpenChange,
  outletId,
  productType,
  onSuccess,
}: QuickOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    items: [] as { productId: string; quantity: number }[],
    paymentMethod: 'online' as 'qris' | 'online' | 'cash',
    bookingDate: '', // ISO date (YYYY-MM-DD)
    bookingTime: '', // HH:MM
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch products and business hours when modal opens
  useEffect(() => {
    if (!open || !outletId) return;

    const fetchData = async () => {
      try {
        // Fetch products
        const response = await productApi.getByOutlet(outletId, {
          limit: 100,
        });

        // Backend returns products directly as array
        const productList = response.data || [];

        // Filter by product type
        const filteredProducts = productList.filter(
          (product: Product) => product.type === productType
        );

        setProducts(filteredProducts as Product[]);

        // Fetch business hours for service booking validation
        if (productType === 'SERVICE') {
          const hours = await outletApi.getBusinessHours(outletId);
          setBusinessHours(hours);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setProducts([]);
        setBusinessHours([]);
      }
    };

    fetchData();
  }, [open, outletId, productType]);

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1 }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const isTimeWithinBusinessHours = (date: string, time: string): boolean => {
    // For GOODS orders, no business hours validation needed
    if (productType === 'GOODS') return true;

    // For SERVICE orders, validate booking time must be within business hours
    if (productType !== 'SERVICE' || !date || !time) return true;

    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();

    // Convert day of week to our format
    const dayNames: BusinessHours['day'][] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayName = dayNames[dayOfWeek];

    const dayHours = businessHours.find(h => h.day === dayName);

    if (!dayHours || !dayHours.isOpen) {
      return false; // Outlet is closed on this day
    }

    if (!dayHours.openTime || !dayHours.closeTime) {
      return false; // No operating hours defined
    }

    const selectedTime = time;
    return selectedTime >= dayHours.openTime && selectedTime <= dayHours.closeTime;
  };

  const getBusinessHoursForDate = (date: string) => {
    if (!date) return null;

    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();

    const dayNames: BusinessHours['day'][] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayName = dayNames[dayOfWeek];

    return businessHours.find(h => h.day === dayName);
  };

  const getBusinessHoursText = (date: string) => {
    const dayHours = getBusinessHoursForDate(date);

    if (!dayHours || !dayHours.isOpen) {
      return 'Outlet tutup pada hari ini';
    }

    if (!dayHours.openTime || !dayHours.closeTime) {
      return 'Jam operasional belum ditentukan';
    }

    return `Jam operasional: ${dayHours.openTime} - ${dayHours.closeTime}`;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Nama customer wajib diisi';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Nomor telepon wajib diisi';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.customerPhone)) {
      newErrors.customerPhone = 'Format nomor telepon tidak valid';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'Minimal satu item harus dipilih';
    } else {
      formData.items.forEach((item, index) => {
        if (!item.productId) {
          newErrors[`item_${index}_product`] = 'Produk harus dipilih';
        }
        if (item.quantity < 1) {
          newErrors[`item_${index}_quantity`] = 'Quantity minimal 1';
        }
      });
    }

    // Booking validation when creating service queue
    if (productType === 'SERVICE') {
      if (!formData.bookingDate) {
        newErrors.bookingDate = 'Tanggal booking wajib diisi';
      }
      if (!formData.bookingTime) {
        newErrors.bookingTime = 'Jam booking wajib diisi';
      }

      // Validate booking time within business hours
      if (formData.bookingDate && formData.bookingTime) {
        const dayHours = getBusinessHoursForDate(formData.bookingDate);

        if (!dayHours || !dayHours.isOpen) {
          newErrors.bookingTime = 'Outlet tutup pada tanggal yang dipilih';
        } else if (!dayHours.openTime || !dayHours.closeTime) {
          newErrors.bookingTime = 'Jam operasional belum ditentukan untuk hari ini';
        } else if (!isTimeWithinBusinessHours(formData.bookingDate, formData.bookingTime)) {
          newErrors.bookingTime = `Jam booking harus antara ${dayHours.openTime} - ${dayHours.closeTime}`;
        }
      }
    } setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const orderData: CreateOrderRequest = {
        guestCustomer: {
          name: formData.customerName.trim(),
          phone: formData.customerPhone.trim(),
        },
        outletId,
        items: formData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentMethod: formData.paymentMethod,
      };

      // Include bookingDate only for service queue
      if (productType === 'SERVICE') {
        const iso = new Date(`${formData.bookingDate}T${formData.bookingTime}:00`).toISOString();
        orderData.bookingDate = iso;
      }

      await orderApi.create(orderData);

      // Reset form
      setFormData({
        customerName: '',
        customerPhone: '',
        items: [],
        paymentMethod: 'online',
        bookingDate: '',
        bookingTime: '',
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating order:', error);
      setErrors({ submit: error.message || 'Gagal membuat pesanan' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        customerName: '',
        customerPhone: '',
        items: [],
        paymentMethod: 'online',
        bookingDate: '',
        bookingTime: '',
      });
      setErrors({});
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Tambah {productType === 'GOODS' ? 'Pesanan' : 'Antrian'} Manual
          </DialogTitle>
          <DialogClose />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6 p-1">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nama Customer *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Masukkan nama customer"
                  disabled={loading}
                />
                {errors.customerName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nomor Telepon *
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="08xxxxxxxxxx"
                  disabled={loading}
                />
                {errors.customerPhone && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.customerPhone}</p>
                )}
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {productType === 'GOODS' ? 'Produk' : 'Layanan'} *
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={loading}
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Item
                </button>
              </div>

              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-6 6-6-6" />
                  </svg>
                  <p className="font-medium">Belum ada item dipilih</p>
                  <p className="text-sm">Klik "Tambah Item" untuk menambahkan.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex-1">
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          disabled={loading}
                        >
                          <option value="">Pilih {productType === 'GOODS' ? 'produk' : 'layanan'}</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} - Rp {product.price.toLocaleString('id-ID')}
                            </option>
                          ))}
                        </select>
                        {errors[`item_${index}_product`] && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[`item_${index}_product`]}</p>
                        )}
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          disabled={loading}
                        />
                        {errors[`item_${index}_quantity`] && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[`item_${index}_quantity`]}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={loading}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md disabled:opacity-50 transition-colors"
                        title="Hapus item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.items && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.items}</p>
              )}
            </div>

            {/* Information notice for different product types */}
            {productType === 'GOODS' ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                      Pesanan Barang
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Anda dapat menambahkan pesanan barang kapan saja tanpa batasan jam operasional.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Aturan Booking Antrian Jasa
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Anda dapat menambahkan antrian kapan saja, namun jam booking harus dalam jam operasional outlet.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Booking fields for Service queue */}
            {productType === 'SERVICE' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tanggal Booking *
                  </label>
                  <input
                    type="date"
                    value={formData.bookingDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookingDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    disabled={loading}
                  />
                  {errors.bookingDate && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.bookingDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Jam Booking *
                  </label>
                  <input
                    type="time"
                    value={formData.bookingTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookingTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    disabled={loading}
                  />
                  {formData.bookingDate && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {getBusinessHoursText(formData.bookingDate)}
                    </p>
                  )}
                  {errors.bookingTime && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.bookingTime}</p>
                  )}
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Metode Pembayaran
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'qris' | 'online' | 'cash' }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={loading}
              >
                <option value="online">Online (Transfer/E-wallet)</option>
                <option value="qris">QRIS</option>
                <option value="cash">Cash / Bayar di tempat</option>
              </select>
            </div>

            {/* Total */}
            {formData.items.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total:</span>
                  <span className="text-xl font-bold text-red-600 dark:text-red-400">
                    Rp {calculateTotal().toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || formData.items.length === 0}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {loading ? 'Membuat...' : `Buat ${productType === 'GOODS' ? 'Pesanan' : 'Antrian'}`}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}