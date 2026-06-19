"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { gooeyToast } from "goey-toast";
import { RefreshCw, Plus, LayoutGrid, Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { QueueStatsBar } from "./queue-stats-bar";
import { KanbanBoard } from "./kanban-board";
import { ServiceFocusView } from "./service-focus-view";
import { QueueDetailSheet } from "./queue-detail-sheet";
import { ProofPreviewDialog } from "./proof-preview-dialog";
import { RescheduleDialog } from "./reschedule-dialog";

import {
  useQueueV2Board,
  useQueueV2Transition,
} from "@/hooks/api/use-queue-v2";
import type {
  QueueV2Entry,
  QueueOrderStatus,
} from "@/lib/apis/queue-v2";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface QueueV2ContentProps {
  outletId: string;
}

interface ConfirmState {
  entry: QueueV2Entry;
  nextStatus: QueueOrderStatus;
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
  CONFIRMED: "Dikonfirmasi",
  PROCESSING: "Diproses",
  ON_GOING: "Sedang Dilayani",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export function QueueV2Content({ outletId }: QueueV2ContentProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"kanban" | "focus">("focus");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState<string | undefined>(undefined);
  const transition = useQueueV2Transition();

  const queryDebounce = useDebounce(query, 1000);
  const { data, isLoading, isFetching, refetch } = useQueueV2Board(outletId, queryDebounce, date);

  const [detailEntry, setDetailEntry] = useState<QueueV2Entry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [proofEntry, setProofEntry] = useState<QueueV2Entry | null>(null);
  const [proofOpen, setProofOpen] = useState(false);
  const [rescheduleEntry, setRescheduleEntry] = useState<QueueV2Entry | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  // Handle primary action (advance status)
  const handlePrimaryAction = useCallback((entry: QueueV2Entry, nextStatus: QueueOrderStatus) => {
    const currentLabel = STATUS_LABELS[entry.orderStatus] ?? entry.orderStatus;
    const nextLabel = STATUS_LABELS[nextStatus] ?? nextStatus;

    setConfirmState({
      entry,
      nextStatus,
      title: `Ubah Status Antrian`,
      description: `Antrian #${entry.position} (${entry.productName}) - ${entry.customerName}\nStatus: "${currentLabel}" → "${nextLabel}"`,
      confirmLabel: nextLabel,
      confirmVariant: "default",
    });
    setConfirmOpen(true);
  }, []);

  // Handle cancel
  const handleCancel = useCallback((entry: QueueV2Entry) => {
    setConfirmState({
      entry,
      nextStatus: "CANCELLED",
      title: "Batalkan Antrian",
      description: `Apakah Anda yakin ingin membatalkan antrian #${entry.position} (${entry.customerName} - ${entry.productName})?`,
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
        await transition.mutateAsync({
          orderId: confirmState.entry.id,
          status: confirmState.nextStatus,
          reason,
        });

        const label = STATUS_LABELS[confirmState.nextStatus] ?? confirmState.nextStatus;
        gooeyToast.success(`Antrian #${confirmState.entry.position} → ${label}`);
        setConfirmOpen(false);
        setConfirmState(null);
        setDetailOpen(false);
      } catch (error: any) {
        const message =
          error?.response?.data?.message ?? error?.message ?? "Gagal mengubah status antrian";
        gooeyToast.error(message);
      }
    },
    [confirmState, transition],
  );

  // Detail sheet
  const handleDetail = useCallback((entry: QueueV2Entry) => {
    setDetailEntry(entry);
    setDetailOpen(true);
  }, []);

  // View proof
  const handleViewProof = useCallback((entry: QueueV2Entry) => {
    setProofEntry(entry);
    setProofOpen(true);
  }, []);

  // Reschedule
  const handleReschedule = useCallback((entry: QueueV2Entry) => {
    setRescheduleEntry(entry);
    setRescheduleOpen(true);
  }, []);

  const board = data?.board ?? { waiting: [], ready: [], inProgress: [], completed: [] };
  const stats = data?.stats ?? {
    totalActive: 0,
    waitingCount: 0,
    readyCount: 0,
    inProgressCount: 0,
    completedToday: 0,
    cancelledToday: 0,
    avgWaitMinutes: null,
  };

  if (isLoading && !query) {
    return <QueueV2Skeleton />;
  }

  return (
    <div className="mx-auto max-w-[1600px] p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Antrian Layanan
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola antrian layanan jasa secara real-time
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border/40 mr-2">
              <Button
                variant={viewMode === "focus" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("focus")}
              >
                <Monitor className="w-3.5 h-3.5 mr-2" />
                Focus
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="w-3.5 h-3.5 mr-2" />
                Kanban
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button size="sm" onClick={() => router.push("/cashier/pos")}>
              <Plus className="w-4 h-4" />
              Tambah Antrian
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari (Nama / No Telpon / Order ID)..."
            className="w-full sm:max-w-sm h-9 text-xs"
          />
          <DatePicker
            value={date}
            onValueChange={setDate}
            placeholder="Semua Tanggal"
            className="w-full sm:w-[200px] h-9"
          />
        </div>
      </div>

      {/* Stats */}
      <QueueStatsBar stats={stats} />

      {/* Conditional View Rendering */}
      {viewMode === "kanban" ? (
        <KanbanBoard
          board={board}
          onPrimaryAction={handlePrimaryAction}
          onCancel={handleCancel}
          onDetail={handleDetail}
          onViewProof={handleViewProof}
          pendingId={transition.isPending ? (confirmState?.entry.id ?? null) : null}
        />
      ) : (
        <ServiceFocusView
          board={board}
          onPrimaryAction={handlePrimaryAction}
          onCancel={handleCancel}
          onDetail={handleDetail}
          onViewProof={handleViewProof}
          pendingId={transition.isPending ? (confirmState?.entry.id ?? null) : null}
        />
      )}

      {/* Detail Sheet */}
      <QueueDetailSheet
        entry={detailEntry}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onPrimaryAction={handlePrimaryAction}
        onCancel={handleCancel}
        onViewProof={handleViewProof}
        onReschedule={handleReschedule}
        isPending={transition.isPending}
      />

      {/* Proof Preview */}
      <ProofPreviewDialog entry={proofEntry} open={proofOpen} onOpenChange={setProofOpen} />

      {/* Reschedule Dialog */}
      <RescheduleDialog
        entry={rescheduleEntry}
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        onSuccess={() => setDetailOpen(false)}
      />

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
        confirmLoading={transition.isPending}
        onConfirm={executeTransition}
        showInput={confirmState?.showInput}
        inputPlaceholder={confirmState?.inputPlaceholder}
        inputRequired={confirmState?.inputRequired}
      />
    </div>
  );
}

function QueueV2Skeleton() {
  return (
    <div className="mx-auto max-w-[1600px] p-4 space-y-4">
      {/* Header skeleton */}
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

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-md" />
        ))}
      </div>

      {/* Board skeleton */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-10 rounded-md" />
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-36 rounded-md" />
            ))}
          </div>
        ))}
      </div>

      {/* Mobile skeleton */}
      <div className="lg:hidden space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-10 rounded-md" />
            <Skeleton className="h-36 rounded-md" />
            <Skeleton className="h-36 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
