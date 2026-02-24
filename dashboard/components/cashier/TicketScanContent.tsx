"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useVerifyTicket, useRedeemTicket, TicketCodeInfo } from "@/hooks/use-ticket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Ticket,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Calendar,
  User,
  Phone,
  Loader2,
  ScanLine,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  VALID: {
    label: "Aktif",
    variant: "default" as const,
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/20",
    icon: Ticket,
  },
  REDEEMED: {
    label: "Sudah Digunakan",
    variant: "secondary" as const,
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Dibatalkan",
    variant: "destructive" as const,
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    icon: XCircle,
  },
  EXPIRED: {
    label: "Kadaluarsa",
    variant: "outline" as const,
    color: "text-gray-700 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-900/20",
    icon: Clock,
  },
} as const;

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TicketResult({
  ticket,
  onRedeem,
  isRedeeming,
}: {
  ticket: TicketCodeInfo;
  onRedeem: () => void;
  isRedeeming: boolean;
}) {
  const config = STATUS_CONFIG[ticket.status];
  const StatusIcon = config.icon;

  return (
    <Card className={cn("rounded-md", config.bg)}>
      <CardContent className="p-4 space-y-3">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn("w-5 h-5", config.color)} />
            <span className="font-semibold">{ticket.productName}</span>
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>

        <Separator />

        {/* Ticket Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{ticket.customerName || "-"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{ticket.customerPhone || "-"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono text-xs">Order: #{ticket.orderId.slice(0, 12)}</span>
            </div>
          </div>
          <div className="space-y-2">
            {ticket.venue && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{ticket.venue}</span>
              </div>
            )}
            {ticket.eventDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{formatDate(ticket.eventDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Redeemed Info */}
        {ticket.status === "REDEEMED" && (
          <div className="rounded-md border p-3 bg-blue-50/50 dark:bg-blue-900/10 space-y-1">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Sudah di-redeem
            </p>
            <p className="text-xs text-muted-foreground">
              Waktu: {formatDate(ticket.redeemedAt)}
            </p>
            {ticket.redeemedBy && (
              <p className="text-xs text-muted-foreground">
                Oleh: {ticket.redeemedBy.name}
              </p>
            )}
          </div>
        )}

        {/* Redeem Button */}
        {ticket.status === "VALID" && (
          <Button
            onClick={onRedeem}
            disabled={isRedeeming}
            className="w-full"
            size="lg"
          >
            {isRedeeming ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Konfirmasi & Redeem Tiket
          </Button>
        )}

        {/* Non-valid status messages */}
        {ticket.status === "CANCELLED" && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-700 dark:text-red-400">Tiket ini sudah dibatalkan</p>
          </div>
        )}
        {ticket.status === "EXPIRED" && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-gray-50/50 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-800">
            <Clock className="w-4 h-4 text-gray-600" />
            <p className="text-sm text-gray-700 dark:text-gray-400">Tiket ini sudah kadaluarsa</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TicketScanContent() {
  const [inputCode, setInputCode] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    data: ticket,
    isLoading: isVerifying,
    error: verifyError,
    isError,
  } = useVerifyTicket(searchCode);

  const redeemMutation = useRedeemTicket();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = useCallback(() => {
    const code = inputCode.trim().toUpperCase();
    if (!code) return;
    setSearchCode(code);
  }, [inputCode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleRedeem = useCallback(async () => {
    if (!searchCode) return;
    try {
      const result = await redeemMutation.mutateAsync(searchCode);
      toast.success(`Tiket berhasil di-redeem untuk ${result.customerName || "pelanggan"}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Gagal redeem tiket";
      toast.error(msg);
    }
  }, [searchCode, redeemMutation]);

  const handleClear = useCallback(() => {
    setInputCode("");
    setSearchCode("");
    inputRef.current?.focus();
  }, []);

  const errorMessage =
    isError && verifyError
      ? (verifyError as any)?.response?.data?.message || "Kode tiket tidak ditemukan"
      : null;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card className="rounded-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScanLine className="w-5 h-5" />
            Verifikasi & Redeem Tiket
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Scan QR code atau masukkan kode tiket secara manual untuk memverifikasi dan meng-redeem tiket pelanggan.
          </p>

          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="Masukkan kode tiket (contoh: TIX-ABCD1234)"
              className="font-mono tracking-wider"
              autoFocus
            />
            <Button onClick={handleSearch} disabled={!inputCode.trim() || isVerifying}>
              {isVerifying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {searchCode && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs">
              Reset
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Loading */}
      {isVerifying && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Memverifikasi tiket...</span>
        </div>
      )}

      {/* Error */}
      {errorMessage && (
        <Card className="rounded-md border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Ticket Result */}
      {ticket && !isVerifying && (
        <TicketResult
          ticket={ticket}
          onRedeem={handleRedeem}
          isRedeeming={redeemMutation.isPending}
        />
      )}
    </div>
  );
}
