'use client';

import { useMemo, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { OrdersHeader } from '@/components/owner/orders/Header';
import { OrdersControls } from '@/components/owner/orders/Controls';
import { OrdersDesktopTable } from '@/components/owner/orders/DesktopTable';
import { OrdersMobileCards } from '@/components/owner/orders/MobileCards';
import { OrdersEmptyState } from '@/components/owner/orders/EmptyState';
import { useGoodsOrders } from '@/hooks/useOrders';
import { useSelectedOutletId } from '@/hooks/useOutlet';

export default function OrdersPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const { outletId, loading: outletLoading } = useSelectedOutletId();
  const { data, loading, error } = useGoodsOrders({ outletId, status });

  const filtered: ReturnType<typeof Array.prototype.slice> & import('@/lib/apis/order').GoodsOrder[] = useMemo(() => {
    const source = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return source;
    return source.filter((o) => {
      const code = (o.code || o.id).toLowerCase();
      const name = (o.customerName || '').toLowerCase();
      return code.includes(q) || name.includes(q);
    });
  }, [data, search]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <OrdersHeader />
        <div className="flex items-center justify-between">
          <OrdersControls status={status} onStatusChange={setStatus} search={search} onSearchChange={setSearch} />
        </div>

        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        {outletLoading || loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
            </div>
          </div>
        ) : !outletId ? (
          <div className="text-sm text-gray-600">Pilih outlet terlebih dahulu.</div>
        ) : !data || filtered.length === 0 ? (
          <OrdersEmptyState />
        ) : (
          <>
            <OrdersDesktopTable data={filtered} />
            <OrdersMobileCards data={filtered} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
