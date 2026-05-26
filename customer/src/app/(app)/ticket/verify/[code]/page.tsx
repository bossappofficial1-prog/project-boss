"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  User,
  Download,
  Store,
  AlertCircle,
  Loader2,
  Phone,
} from "lucide-react";

import api from "@/lib/api";
import { Order } from "@/services/order";
import { Button } from "@/components/ui/button";
import { useAppBarV2 } from "@/context/AppBarContextV2";
import TicketQRCard from "@/components/orders/parts/TicketQRCard";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/Base";

interface TicketData {
  id: string;
  code: string;
  status: "VALID" | "REDEEMED" | "CANCELLED" | "EXPIRED";
  productName: string;
  eventDate: string | null;
  eventEndDate: string | null;
  venue: string | null;
  venueAddress: string | null;
  customerName: string | null;
  customerPhone: string | null;
  orderId: string;
  outletId: string;
  outletName: string;
  redeemedAt: string | null;
  redeemedBy: string | null;
  createdAt: string;
}

// Local helper component for rendering details matching the app style
function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label?: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        {label && (
          <p className="text-[10px] text-muted-foreground leading-none mb-0.5">
            {label}
          </p>
        )}
        <p
          className={cn(
            "text-xs font-medium text-foreground truncate",
            mono && "font-mono",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function TicketVerifyPage() {
  const { code } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [downloading, setDownloading] = useState(false);

  // App Bar setup matching native B2C style
  const { setAppBar, resetAppBar } = useAppBarV2();

  useEffect(() => {
    if (!ticket) return;

    setAppBar({
      title: "Detail E-Tiket",
      subtitle: ticket.code,
      showBackButton: true,
      onLeftClick() {
        router.push("/");
      },
    });

    return () => resetAppBar();
  }, [ticket, setAppBar, resetAppBar, router]);

  useEffect(() => {
    if (!code) return;

    const fetchTicket = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getData<TicketData>(`/tickets/verify/${code}`);
        setTicket(data);
      } catch (err: any) {
        console.error("Gagal memuat tiket:", err);
        setError(
          err.response?.data?.message ||
            "Tiket tidak ditemukan atau terjadi kesalahan saat mengambil data.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [code]);

  const handleDownloadPDF = async () => {
    if (!ticket?.orderId) return;
    try {
      setDownloading(true);
      const pdfBlob = await Order.downloadTickets(ticket.orderId);

      const blobUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `Tiket_${ticket.code}.pdf`);
      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Gagal mengunduh PDF tiket:", err);
      alert("Gagal mengunduh PDF tiket. Silakan coba beberapa saat lagi.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Memverifikasi tiket..." />;
  }

  if (error || !ticket) {
    return (
      <div className="space-y-4 py-6 px-1">
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-destructive">
              Tiket Tidak Valid
            </h3>
            <p className="text-xs text-muted-foreground leading-normal">
              {error || "Kode tiket tidak terdaftar di sistem BOSS."}
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push("/")}
          className="w-full h-11 text-xs font-semibold rounded-xl"
        >
          Kembali ke Beranda
        </Button>
      </div>
    );
  }

  // Map TicketData fields into existing TicketCode props expected by TicketQRCard
  const mappedTicketCode = {
    id: ticket.id,
    code: ticket.code,
    status: ticket.status,
    redeemedAt: ticket.redeemedAt,
    redeemedBy: ticket.redeemedBy,
    createdAt: ticket.createdAt,
  };

  const formattedDate = ticket.eventDate
    ? new Date(ticket.eventDate).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const formattedTime = ticket.eventDate
    ? new Date(ticket.eventDate).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-4 pb-24 px-1 pt-1">
      {/* 1. Reuse existing TicketQRCard component for 100% UI consistency */}
      <div className="bg-background">
        <TicketQRCard
          ticketCode={mappedTicketCode}
          productName={ticket.productName}
          index={0}
        />
        <p className="text-[10px] text-muted-foreground text-center mt-2.5">
          Tunjukkan QR code di atas kepada petugas masuk untuk pemindaian
        </p>
      </div>

      {/* 2. Event details card */}
      <div className="rounded-md border bg-card overflow-hidden">
        <div className="px-3 py-2 flex items-center justify-between bg-muted/20 border-b">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Detail Event
          </span>
        </div>
        <div className="p-3.5 space-y-3.5">
          <InfoRow icon={Store} label="Nama Event" value={ticket.productName} />
          {ticket.eventDate && (
            <InfoRow
              icon={Calendar}
              label="Waktu Pelaksanaan"
              value={
                <span className="capitalize">
                  {formattedDate}{" "}
                  {formattedTime && `• Pukul ${formattedTime} WIB`}
                </span>
              }
            />
          )}
          {ticket.venue && (
            <InfoRow
              icon={MapPin}
              label="Lokasi Event"
              value={
                <div>
                  <span className="block leading-none mb-0.5">
                    {ticket.venue}
                  </span>
                  {ticket.venueAddress && (
                    <span className="text-[10px] text-muted-foreground font-normal block leading-tight">
                      {ticket.venueAddress}
                    </span>
                  )}
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* 3. Ticket Holder details card */}
      <div className="rounded-md border bg-card overflow-hidden">
        <div className="px-3 py-2 flex items-center justify-between bg-muted/20 border-b">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Detail Pemegang Tiket
          </span>
        </div>
        <div className="p-3.5 space-y-3.5">
          <InfoRow
            icon={User}
            label="Nama Lengkap"
            value={ticket.customerName || "Pelanggan BOSS"}
          />
          {ticket.customerPhone && (
            <InfoRow
              icon={Phone}
              label="Nomor Telepon"
              value={ticket.customerPhone}
            />
          )}
          <InfoRow
            icon={Store}
            label="Penyelenggara / Merchant"
            value={ticket.outletName}
          />
        </div>
      </div>

      {/* 4. Action buttons in mobile style */}
      <div className="flex flex-col gap-2 pt-2">
        <Button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="w-full h-11 text-xs font-semibold rounded-xl"
        >
          {downloading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengunduh PDF...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" /> Unduh PDF E-Tiket
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/")}
          className="w-full h-11 text-xs font-semibold rounded-xl"
        >
          Kembali ke Beranda
        </Button>
      </div>
    </div>
  );
}
