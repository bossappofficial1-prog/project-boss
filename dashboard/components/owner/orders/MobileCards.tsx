"use client";

import { GoodsOrder } from "@/lib/apis/order";
import { formatDateTime } from "@/lib/utils/date";
import { getOrderStatusInfo } from "@/lib/utils/status";

type Props = {
  data: GoodsOrder[];
};

export function OrdersMobileCards({ data }: Props) {
  return (
    <div className="md:hidden space-y-3">
      {data.map((order) => (
  <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-gray-500 font-mono">{order.code || order.id.slice(0, 8).toUpperCase()}</div>
              <div className="text-sm font-semibold text-gray-900">{order.customerName}</div>
              <div className="text-xs text-gray-500">{order.customerPhone}</div>
            </div>
            {(() => {
              const info = getOrderStatusInfo(order.orderStatus || order.status);
              return (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${info.className}`}>
                  {info.label}
                </span>
              );
            })()}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</div>
            <div className="text-sm font-semibold">Rp {order.totalAmount?.toLocaleString('id-ID')}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
