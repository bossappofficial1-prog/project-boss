"use client";

import { useState } from 'react';
import { orderApi, type GoodsOrder, type OrderStatus } from '@/lib/apis/order';

interface OrdersMobileCardsProps {
  orders: GoodsOrder[];
  onRefresh: () => void;
}

export function OrdersMobileCards({ orders, onRefresh }: OrdersMobileCardsProps) {
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(orderId);
    try {
      await orderApi.updateStatus(orderId, newStatus);
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusOptions = (currentStatus: string) => {
    const allStatuses = [
      { value: 'AWAITING_PAYMENT', label: 'Menunggu Bayar' },
      { value: 'PROCESSING', label: 'Diproses' },
      { value: 'READY', label: 'Siap' },
      { value: 'COMPLETED', label: 'Selesai' },
      { value: 'CANCELLED', label: 'Dibatalkan' },
      { value: 'CONFIRMED', label: 'Dikonfirmasi' },
    ];

    return allStatuses;
  };

  const handleStatusChange = (orderId: string, currentStatus: string, newStatus: string) => {
    if (newStatus === currentStatus) return;

    const statusLabels: { [key: string]: string } = {
      'AWAITING_PAYMENT': 'Menunggu Bayar',
      'PROCESSING': 'Diproses',
      'READY': 'Siap',
      'COMPLETED': 'Selesai',
      'CANCELLED': 'Dibatalkan',
      'CONFIRMED': 'Dikonfirmasi'
    };

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin mengubah status pesanan #${orderId.slice(-8)} dari "${statusLabels[currentStatus]}" menjadi "${statusLabels[newStatus]}"?`
    );

    if (confirmed) {
      handleStatusUpdate(orderId, newStatus as OrderStatus);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'AWAITING_PAYMENT': { label: 'Menunggu Bayar', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
      'PROCESSING': { label: 'Diproses', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      'READY': { label: 'Siap', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      'COMPLETED': { label: 'Selesai', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      'CANCELLED': { label: 'Dibatalkan', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
      'CONFIRMED': { label: 'Dikonfirmasi', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-white dark:bg-gray-800 rounded-xl shadow dark:shadow-gray-900/20 p-4 border dark:border-gray-700"
        >
          {/* Header with order ID and status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  #{order.id.slice(-8)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
            <select
              value={order.orderStatus}
              onChange={(e) => handleStatusChange(order.id, order.orderStatus, e.target.value)}
              disabled={updatingStatus === order.id}
              className="text-xs font-medium rounded-full px-2.5 py-0.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 cursor-pointer disabled:opacity-50"
            >
              {getStatusOptions(order.orderStatus).map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Customer and product details */}
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Customer:</span>
              <p className="text-gray-900 dark:text-gray-100 mt-1">
                {order.guestCustomer.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {order.guestCustomer.phone}
              </p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Produk:</span>
              <p className="text-gray-900 dark:text-gray-100 mt-1">
                {order.items?.[0]?.product?.name || 'Produk'}
                {order.items && order.items.length > 1 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    +{order.items.length - 1} item lainnya
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total:</span>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(order.totalAmount)}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pembayaran:</span>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {(() => {
                    const anyOrder = order as any;
                    const paymentMethod = anyOrder.paymentMethod || anyOrder.transaction?.paymentMethod || (anyOrder.midtrans ? 'online' : (anyOrder.paymentMethod === 'manual_transfer' ? 'manual' : 'online'));
                    return String(paymentMethod).charAt(0).toUpperCase() + String(paymentMethod).slice(1);
                  })()}
                </p>
                {(() => {
                  const anyOrder = order as any;
                  const proofUrl = anyOrder.paymentProofUrl || anyOrder.transaction?.paymentProofUrl || anyOrder.transaction?.midtrans?.qrUrl || anyOrder.payment?.proofUrl || null;
                  if (!proofUrl) return null;
                  return (
                    <a href={proofUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Lihat bukti</a>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {(() => {
              const anyOrder = order as any;
              const proofUrl = anyOrder.paymentProofUrl || anyOrder.transaction?.paymentProofUrl || anyOrder.transaction?.midtrans?.qrUrl || anyOrder.payment?.proofUrl || null;
              const isManualMethod = (anyOrder.paymentMethod === 'manual_transfer') || Boolean(anyOrder.transaction?.isManual) || String(anyOrder.paymentMethod || '').toLowerCase().includes('manual');
              const awaitingVerification = (String(anyOrder.paymentStatus || '').toUpperCase() === 'AWAITING_VERIFICATION') || (String(order.orderStatus || '').toUpperCase() === 'AWAITING_VERIFICATION');
              const showConfirm = order.orderStatus === 'AWAITING_PAYMENT' || (isManualMethod && (proofUrl || awaitingVerification));
              if (!showConfirm) return null;

              return (
                <button
                  onClick={() => {
                    const proofNote = proofUrl ? `\nBukti pembayaran ditemukan: buka untuk verifikasi.` : '\nTidak ada bukti pembayaran terlampir.';
                    const ok = window.confirm(`Pesanan ini berstatus Menunggu Bayar (QRIS/Transfer/Manual).\n\nCustomer: ${order.guestCustomer.name}\nTotal: ${formatCurrency(order.totalAmount)}${proofNote}\n\nApakah yakin ingin memproses sekarang? Status akan diubah menjadi Diproses.`);
                    if (!ok) return;
                    handleStatusUpdate(order.id, 'PROCESSING');
                  }}
                  disabled={updatingStatus === order.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-50 transition-colors"
                >
                  {updatingStatus === order.id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span className="text-sm font-medium">Konfirmasi Bayar</span>
                </button>
              );
            })()}

            {order.orderStatus === 'PROCESSING' && (
              <button
                onClick={() => handleStatusUpdate(order.id, 'READY')}
                disabled={updatingStatus === order.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 transition-colors"
              >
                {updatingStatus === order.id ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="text-sm font-medium">Tandai Siap</span>
              </button>
            )}

            {order.orderStatus === 'READY' && (
              <button
                onClick={() => handleStatusUpdate(order.id, 'COMPLETED')}
                disabled={updatingStatus === order.id}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-50 transition-colors"
              >
                {updatingStatus === order.id ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span className="text-sm font-medium">Selesaikan</span>
              </button>
            )}

            {(order.orderStatus === 'COMPLETED' || order.orderStatus === 'CANCELLED') && (
              <div className="flex-1 text-center py-2 text-sm text-gray-500 dark:text-gray-400">
                {order.orderStatus === 'COMPLETED' ? 'Pesanan telah selesai' : 'Pesanan dibatalkan'}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}