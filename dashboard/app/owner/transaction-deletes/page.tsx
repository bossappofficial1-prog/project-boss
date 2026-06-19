"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCcw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useTransactionDeleteRequests,
  useApproveDeleteRequest,
  useRejectDeleteRequest,
} from "@/hooks/api/use-transaction-delete";
import type { TransactionDeleteRequest } from "@/lib/apis/transaction-delete";
import { gooeyToast } from "goey-toast";
import { usePathname } from "next/navigation";
import { useOutletStore } from "@/stores/outlet.store";
import { useTwoFactorGate } from "@/hooks/use-two-factor-gate";
import { TwoFactorVerifyDialog } from "@/components/ui/two-factor-verify-dialog";

const STATUS_META: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  PENDING: {
    label: "Menunggu",
    className: "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
    icon: <Clock className="h-3 w-3" />,
  },
  APPROVED: {
    label: "Disetujui",
    className: "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  REJECTED: {
    label: "Ditolak",
    className: "border-red-200 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const fmt = new Intl.NumberFormat("id-ID");
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function TransactionDeletesPage() {
  const pathname = usePathname();
  const isManagerView = pathname?.startsWith("/manager") ?? false;
  const { selectedOutletId } = useOutletStore();
  const { is2faEnabled, showVerify, require2FA, handleVerified, handleOpenChange } = useTwoFactorGate();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<TransactionDeleteRequest | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");

  const { data: requests = [], isLoading, refetch } = useTransactionDeleteRequests(
    isManagerView ? selectedOutletId || "" : undefined,
    statusFilter === "all" ? undefined : statusFilter
  );
  const approveMutation = useApproveDeleteRequest();
  const rejectMutation = useRejectDeleteRequest();

  const filteredRequests = requests.filter((req) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      req.customerName.toLowerCase().includes(q) ||
      req.customerPhone.includes(q) ||
      req.requestedStaff?.name?.toLowerCase().includes(q) ||
      (req.items as any[]).some((item) => item.name.toLowerCase().includes(q))
    );
  });

  const handleApprove = (request: TransactionDeleteRequest) => {
    setSelectedRequest(request);
    setApproveDialogOpen(true);
  };

  const handleReject = (request: TransactionDeleteRequest) => {
    setSelectedRequest(request);
    setRejectionNote("");
    setRejectDialogOpen(true);
  };

  const confirmApprove = () => {
    if (!selectedRequest) return;
    require2FA(() => {
      approveMutation.mutate(selectedRequest.id, {
        onSuccess: () => {
          gooeyToast.success("Permintaan penghapusan disetujui. Transaksi telah dihapus.");
          setApproveDialogOpen(false);
          setSelectedRequest(null);
        },
        onError: (error: any) => {
          gooeyToast.error(error?.response?.data?.message || error?.message || "Gagal menyetujui permintaan");
        },
      });
    });
  };

  const confirmReject = () => {
    if (!selectedRequest) return;
    if (!rejectionNote.trim()) {
      gooeyToast.error("Catatan penolakan wajib diisi");
      return;
    }
    rejectMutation.mutate(
      { requestId: selectedRequest.id, rejectionNote: rejectionNote.trim() },
      {
        onSuccess: () => {
          gooeyToast.success("Permintaan penghapusan ditolak.");
          setRejectDialogOpen(false);
          setSelectedRequest(null);
          setRejectionNote("");
        },
        onError: (error: any) => {
          gooeyToast.error(error?.response?.data?.message || error?.message || "Gagal menolak permintaan");
        },
      },
    );
  };

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Permintaan Penghapusan Transaksi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tinjau dan setujui permintaan penghapusan transaksi dari kasir.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
              Daftar Permintaan
              {pendingCount > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                  {pendingCount} menunggu
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari pelanggan, kasir, atau produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="PENDING">Menunggu</SelectItem>
                <SelectItem value="APPROVED">Disetujui</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Trash2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Tidak ada permintaan</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Belum ada permintaan penghapusan transaksi.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => {
                const meta = STATUS_META[request.status];
                const items = request.items as any[];

                return (
                  <div
                    key={request.id}
                    className="rounded-lg border border-border/60 bg-card p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {request.customerName}
                          </p>
                          <Badge variant="outline" className={meta.className}>
                            <span className="flex items-center gap-1">
                              {meta.icon}
                              {meta.label}
                            </span>
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {request.customerPhone} &middot; {request.requestedStaff?.name || "Kasir"} &middot; {dateFmt.format(new Date(request.createdAt))}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-foreground whitespace-nowrap">
                        Rp {fmt.format(request.totalAmount)}
                      </p>
                    </div>

                    <div className="rounded-md bg-muted/30 p-2.5">
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Item</p>
                      <div className="space-y-0.5">
                        {items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-foreground truncate">{item.name}</span>
                            <span className="text-muted-foreground ml-2 whitespace-nowrap">
                              {item.quantity}x @ Rp {fmt.format(item.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {request.reason && (
                      <div className="rounded-md border border-border/40 bg-muted/20 p-2.5">
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Alasan</p>
                        <p className="text-xs text-foreground">{request.reason}</p>
                      </div>
                    )}

                    {request.rejectionNote && (
                      <div className="rounded-md border border-red-200/40 bg-red-50/50 p-2.5 dark:bg-red-900/10 dark:border-red-800/40">
                        <p className="text-[11px] font-medium text-red-600 uppercase tracking-wider mb-1">Catatan Penolakan</p>
                        <p className="text-xs text-red-700 dark:text-red-400">{request.rejectionNote}</p>
                      </div>
                    )}

                    {request.status === "PENDING" && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                          onClick={() => handleApprove(request)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                          onClick={() => handleReject(request)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1.5" />
                          Tolak
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <TwoFactorVerifyDialog
        open={showVerify}
        onOpenChange={handleOpenChange}
        onVerified={handleVerified}
        title="Verifikasi Setujui Hapus Transaksi"
        description="Masukkan kode 2FA untuk menyetujui penghapusan transaksi ini."
      />

      <ConfirmDialog
        open={approveDialogOpen}
        onOpenChange={(open) => {
          setApproveDialogOpen(open);
          if (!open) setSelectedRequest(null);
        }}
        title="Setujui Penghapusan?"
        description="Tindakan ini akan menghapus transaksi secara permanen dan mengembalikan stok produk. Tindakan tidak dapat dibatalkan."
        confirmLabel="Ya, Setujui & Hapus"
        cancelLabel="Batal"
        onConfirm={confirmApprove}
        confirmDisabled={approveMutation.isPending}
        confirmVariant="destructive"
      >
        {selectedRequest && (
          <div className="rounded-md border border-border/60 bg-muted/30 p-3 mt-2 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Pelanggan</span>
              <span className="font-medium text-foreground">{selectedRequest.customerName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium text-foreground">Rp {fmt.format(selectedRequest.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Diajukan oleh</span>
              <span className="font-medium text-foreground">{selectedRequest.requestedStaff?.name || "-"}</span>
            </div>
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open);
          if (!open) {
            setSelectedRequest(null);
            setRejectionNote("");
          }
        }}
        title="Tolak Penghapusan?"
        description="Permintaan penghapusan akan dibatalkan dan transaksi tetap tersimpan."
        confirmLabel="Tolak Permintaan"
        cancelLabel="Batal"
        onConfirm={confirmReject}
        confirmDisabled={rejectMutation.isPending}
        confirmVariant="outline"
      >
        {selectedRequest && (
          <div className="space-y-3 mt-2">
            <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Pelanggan</span>
                <span className="font-medium text-foreground">{selectedRequest.customerName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium text-foreground">Rp {fmt.format(selectedRequest.totalAmount)}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Catatan penolakan <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Jelaskan alasan penolakan..."
                className="text-sm resize-none"
                rows={3}
              />
            </div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
