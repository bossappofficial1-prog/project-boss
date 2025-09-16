"use client";

import { GoodsOrder } from "@/lib/apis/order";
import { formatDateTime } from "@/lib/utils/date";
import { getOrderStatusInfo } from "@/lib/utils/status";

type Props = {
  data: GoodsOrder[];
};

export function OrdersDesktopTable({ data }: Props) {
  return (
    <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900/40">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">No</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kode</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tanggal</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((order, index) => (
            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/60">
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{index + 1}</td>
              <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">{order.code || order.id.slice(0, 8).toUpperCase()}</td>
              <td className="px-4 py-3 text-sm">
                <div className="font-medium text-gray-900 dark:text-gray-100">{order.customerName}</div>
                <div className="text-gray-500 dark:text-gray-400">{order.customerPhone}</div>
              </td>
              <td className="px-4 py-3 text-sm">
                {(() => {
                  const info = getOrderStatusInfo(order.orderStatus || order.status);
                  return (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${info.className}`}>
                      {info.label}
                    </span>
                  );
                })()}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                Rp {order.totalAmount?.toLocaleString('id-ID')}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDateTime(order.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
