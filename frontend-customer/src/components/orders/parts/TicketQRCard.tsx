"use client";

import { memo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { TicketCode } from "@/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, Ticket } from "lucide-react";

interface TicketQRCardProps {
  ticketCode: TicketCode;
  productName: string;
  index: number;
}

const STATUS_CONFIG = {
  VALID: {
    label: "Aktif",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800",
    icon: Ticket,
  },
  REDEEMED: {
    label: "Sudah Digunakan",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Dibatalkan",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800",
    icon: XCircle,
  },
  EXPIRED: {
    label: "Kadaluarsa",
    color: "text-gray-700 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800",
    icon: Clock,
  },
} as const;

function TicketQRCard({ ticketCode, productName, index }: TicketQRCardProps) {
  const config = STATUS_CONFIG[ticketCode.status];
  const StatusIcon = config.icon;
  const isUsable = ticketCode.status === "VALID";

  return (
    <div className={cn("rounded-md border p-3 space-y-3", config.bg)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("w-4 h-4", config.color)} />
          <span className="text-xs font-semibold">{productName} #{index + 1}</span>
        </div>
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", config.bg, config.color)}>
          {config.label}
        </span>
      </div>

      <div className="flex flex-col items-center gap-2">
        {isUsable ? (
          <div className="bg-white p-3 rounded-md">
            <QRCodeSVG
              value={ticketCode.code}
              size={160}
              level="M"
              includeMargin={false}
            />
          </div>
        ) : (
          <div className="w-[160px] h-[160px] flex items-center justify-center bg-muted/50 rounded-md">
            <StatusIcon className={cn("w-12 h-12", config.color, "opacity-30")} />
          </div>
        )}

        <code className="text-xs font-mono text-muted-foreground tracking-wider">
          {ticketCode.code}
        </code>

        {ticketCode.status === "REDEEMED" && ticketCode.redeemedAt && (
          <p className="text-[10px] text-muted-foreground">
            Digunakan: {new Date(ticketCode.redeemedAt).toLocaleString("id-ID")}
          </p>
        )}
      </div>
    </div>
  );
}

export default memo(TicketQRCard);
