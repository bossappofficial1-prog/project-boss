"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { OrdersStatsBar } from "./OrdersStatsBar";
import { OrdersKanbanBoard } from "./OrdersKanbanBoard";
import { OrderDetailSheet } from "./OrderDetailSheet";
import { ProofPreviewDialog } from "./ProofPreviewDialog";
import { useDebounce } from "@/hooks/useDebounce";

import { useOrdersV2Board, useOrdersV2UpdateStatus } from "@/hooks/api/use-orders-v2";
import { ordersV2Api } from "@/lib/apis/orders-v2";
import type { OrderV2Entry, GoodsOrderStatus, OrdersV2Board } from "@/lib/apis/orders-v2";
import { formatCurrency } from "@/components/owner/orders/utils";

interface OrdersV2ContentProps {
  outletId: string;
}

interface ConfirmState {
  entry: OrderV2Entry;
  nextStatus: GoodsOrderStatus;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  showInput?: boolean;
  inputPlaceholder?: string;
  inputRequired?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  AWAITING_PAYMENT: "Menunggu Bayar",
  PROCESSING: "Diproses",
  CONFIRMED: "Dikonfirmasi",
  READY: "Siap Diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export function OrdersV2Content({ outletId }: OrdersV2ContentProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [date, setDate] = useState<string | undefined>(undefined);
  const debouncedQuery = useDebounce(query, 1000);
  const { data, isLoading, refetch } = useOrdersV2Board(outletId, debouncedQuery, date);
  const updateStatus = useOrdersV2UpdateStatus();

  const [detailEntry, setDetailEntry] = useState<OrderV2Entry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [proofEntry, setProofEntry] = useState<OrderV2Entry | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [printingType, setPrintingType] = useState<"receipt" | "ticket" | null>(null);

  // Receipt printing via hidden iframe
  const handlePrint = useCallback(async (entry: OrderV2Entry) => {
    try {
      setPrintingId(entry.id);
      setPrintingType("receipt");
      const blob = await ordersV2Api.getReceipt(entry.id);
      const url = URL.createObjectURL(blob);

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.src = url;

      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setPrintingId(null);
          setPrintingType(null);
        }, 500);
      };
    } catch {
      toast.error("Gagal mencetak struk");
      setPrintingId(null);
      setPrintingType(null);
    }
  }, []);

  const handlePrintTickets = useCallback(async (entry: OrderV2Entry) => {
    try {
      setPrintingId(entry.id);
      setPrintingType("ticket");
      const blob = await ordersV2Api.printOrderTickets(entry.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      toast.error("Gagal mencetak tiket");
    } finally {
      setPrintingId(null);
      setPrintingType(null);
    }
  }, []);

  // Proof preview
  const handleViewProof = useCallback((entry: OrderV2Entry) => {
    setProofEntry(entry);
    setProofOpen(true);
  }, []);

  // Primary action (advance status)
  const handlePrimaryAction = useCallback((entry: OrderV2Entry, nextStatus: GoodsOrderStatus) => {
    const currentLabel = STATUS_LABELS[entry.orderStatus] ?? entry.orderStatus;
    const nextLabel = STATUS_LABELS[nextStatus] ?? nextStatus;

    setConfirmState({
      entry,
      nextStatus,
      title: "Ubah Status Pesanan",
      description: `Pesanan #${entry.id.slice(-8)} (${entry.customerName})\n"${currentLabel}" → "${nextLabel}"\nTotal: ${formatCurrency(entry.totalAmount)}`,
      confirmLabel: nextLabel,
      confirmVariant: "default",
    });
    setConfirmOpen(true);
  }, []);

  // Cancel
  const handleCancel = useCallback((entry: OrderV2Entry) => {
    setConfirmState({
      entry,
      nextStatus: "CANCELLED",
      title: "Batalkan Pesanan",
      description: `Apakah Anda yakin ingin membatalkan pesanan #${entry.id.slice(-8)} (${entry.customerName})?\nTotal: ${formatCurrency(entry.totalAmount)}`,
      confirmLabel: "Batalkan",
      confirmVariant: "destructive",
      showInput: true,
      inputPlaceholder: "Masukkan alasan pembatalan (wajib)...",
      inputRequired: true,
    });
    setConfirmOpen(true);
  }, []);

  // Execute transition
  const executeTransition = useCallback(
    async (reason?: string) => {
      if (!confirmState) return;

      try {
        await updateStatus.mutateAsync({
          orderId: confirmState.entry.id,
          status: confirmState.nextStatus,
          reason,
        });

        const label = STATUS_LABELS[confirmState.nextStatus] ?? confirmState.nextStatus;
        toast.success(`Pesanan #${confirmState.entry.id.slice(-8)} → ${label}`);
        setConfirmOpen(false);
        setConfirmState(null);
        setDetailOpen(false);
      } catch (error: any) {
        const message =
          error?.response?.data?.message ?? error?.message ?? "Gagal mengubah status pesanan";
        toast.error(message);
      }
    },
    [confirmState, updateStatus],
  );

  // Detail sheet
  const handleDetail = useCallback((entry: OrderV2Entry) => {
    setDetailEntry(entry);
    setDetailOpen(true);
  }, []);

  const board: OrdersV2Board = data?.board ?? {
    pending: [],
    processing: [],
    ready: [],
    completed: [],
  };
  const stats = data?.stats ?? {
    totalActive: 0,
    pendingCount: 0,
    processingCount: 0,
    readyCount: 0,
    completedToday: 0,
    cancelledToday: 0,
    revenueToday: 0,
  };

  if (isLoading) {
    return <OrdersV2Skeleton />;
  }

  return (
    <div className="mx-auto max-w-[1600px] p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Pesanan Barang</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Kelola pesanan barang secara real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => router.push("/cashier/pos-v2")}>
              <Plus className="w-4 h-4 mr-2" />
              Pesanan Baru
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari (Nama / No Telpon / Order ID)..."
            className="w-full sm:max-w-sm"
          />
          <DatePicker
            value={date}
            onValueChange={setDate}
            placeholder="Semua Tanggal"
            className="w-full sm:w-[240px]"
          />
        </div>
      </div>

      {/* Stats */}
      <OrdersStatsBar stats={stats} />

      {/* Kanban Board */}
      <OrdersKanbanBoard
        board={board}
        onPrimaryAction={handlePrimaryAction}
        onCancel={handleCancel}
        onDetail={handleDetail}
        onPrint={handlePrint}
        onPrintTickets={handlePrintTickets}
        onViewProof={handleViewProof}
        pendingId={updateStatus.isPending ? (confirmState?.entry.id ?? null) : null}
        printingId={printingId}
        printingType={printingType}
      />

      {/* Detail Sheet */}
      <OrderDetailSheet
        entry={detailEntry}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onPrimaryAction={handlePrimaryAction}
        onCancel={handleCancel}
        onPrint={handlePrint}
        onPrintTickets={handlePrintTickets}
        onViewProof={handleViewProof}
        isPending={updateStatus.isPending}
        printingId={printingId}
        printingType={printingType}
      />

      {/* Proof Preview Dialog */}
      <ProofPreviewDialog entry={proofEntry} open={proofOpen} onOpenChange={setProofOpen} />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen && Boolean(confirmState)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmOpen(false);
            setConfirmState(null);
          }
        }}
        title={confirmState?.title ?? "Konfirmasi"}
        description={confirmState?.description}
        confirmLabel={confirmState?.confirmLabel ?? "Konfirmasi"}
        confirmVariant={confirmState?.confirmVariant}
        confirmLoading={updateStatus.isPending}
        onConfirm={executeTransition}
        showInput={confirmState?.showInput}
        inputPlaceholder={confirmState?.inputPlaceholder}
        inputRequired={confirmState?.inputRequired}
      />
    </div>
  );
}

function OrdersV2Skeleton() {
  return (
    <div className="mx-auto max-w-[1600px] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-md" />
        ))}
      </div>

      <div className="hidden lg:grid lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-10 rounded-md" />
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-40 rounded-md" />
            ))}
          </div>
        ))}
      </div>

      <div className="lg:hidden space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-10 rounded-md" />
            <Skeleton className="h-40 rounded-md" />
            <Skeleton className="h-40 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
