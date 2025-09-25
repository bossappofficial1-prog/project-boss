"use client";

import { useState } from 'react';
import { orderApi, type GoodsOrder, type OrderStatus } from '@/lib/apis/order';

interface OrdersDesktopTableProps {
  orders: GoodsOrder[];
  onRefresh: () => void;
}

export function OrdersDesktopTable({ orders, onRefresh }: OrdersDesktopTableProps) {
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
    <div className="hidden sm:block overflow-x-auto rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-900">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">No</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID Pesanan</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Produk</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pembayaran</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Waktu Pesan</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {orders.map((order, idx) => (
            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-3">
                <div className="text-sm text-gray-900 dark:text-gray-100">{idx + 1}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  #{order.id.slice(-8)}
                </div>
              </td>
              <td className="px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {order.guestCustomer.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {order.guestCustomer?.phone}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {order.items?.[0]?.product?.name || 'Produk'}
                  </div>
                  {order.items && order.items.length > 1 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      +{order.items.length - 1} item lainnya
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(order.totalAmount)}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  Online
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(order.createdAt)}
                </div>
              </td>
              <td className="px-4 py-3">
                <select
                  value={order.orderStatus}
                  onChange={(e) => handleStatusChange(order.id, order.orderStatus, e.target.value)}
                  disabled={updatingStatus === order.id}
                  className="text-xs font-medium rounded-full px-2.5 py-0.5 border-0 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 cursor-pointer disabled:opacity-50"
                >
                  {getStatusOptions(order.orderStatus).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                    {order.orderStatus === 'AWAITING_PAYMENT' && (
                      <button
                        onClick={() => {
                          const ok = window.confirm(`Pesanan ini berstatus Menunggu Bayar (QRIS/Transfer).\n\nCustomer: ${order.guestCustomer.name}\nTotal: ${formatCurrency(order.totalAmount)}\n\nApakah yakin ingin memproses sekarang? Status akan diubah menjadi Diproses.`);
                          if (!ok) return;
                          handleStatusUpdate(order.id, 'PROCESSING');
                        }}
                        disabled={updatingStatus === order.id}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                        title="Konfirmasi pembayaran"
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
                      </button>
                    )}
                    
                    {order.orderStatus === 'PROCESSING' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'READY')}
                        disabled={updatingStatus === order.id}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                        title="Tandai sebagai siap"
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
                      </button>
                    )}
                    
                    {order.orderStatus === 'READY' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'COMPLETED')}
                        disabled={updatingStatus === order.id}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                        title="Selesaikan"
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
                      </button>
                    )}
                  </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}