"use client";

import { QueueEntry } from "@/lib/apis/order";
import { formatDateTime } from "@/lib/utils/date";
import { getQueueStatusInfo } from "@/lib/utils/status";

type Props = {
  data: QueueEntry[];
};

export function QueueMobileCards({ data }: Props) {
  return (
    <div className="md:hidden space-y-3">
      {data.map((q) => (
        <div key={q.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-gray-500">No Antrian</div>
              <div className="text-lg font-semibold text-gray-900">{q.position ?? q.queueNumber}</div>
              <div className="text-sm text-gray-700 mt-1">{q.customerName}</div>
              <div className="text-xs text-gray-500">{q.productName || '-'}</div>
            </div>
            {(() => {
              const info = getQueueStatusInfo(q.status);
              return (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${info.className}`}>
                  {info.label}
                </span>
              );
            })()}
          </div>
          <div className="mt-3 text-xs text-gray-500">{formatDateTime(q.createdAt)}</div>
        </div>
      ))}
    </div>
  );
}
