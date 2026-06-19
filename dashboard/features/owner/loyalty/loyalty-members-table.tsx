"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { type OutletMembership } from "@/lib/apis/loyalty";
import { useLoyaltyMembers, useAdjustPoints, useLoyaltyPointHistory } from "@/hooks/api/use-loyalty";
import { Badge } from "@/components/ui/badge";
import { User, Trophy, Calendar, PlusCircle, MinusCircle, History, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gooeyToast } from "goey-toast";
import { cn } from "@/lib/utils";

export function LoyaltyMembersTable({ outletId }: { outletId: string }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [editingMember, setEditingMember] = useState<OutletMembership | null>(null);
  const [pointsToAdjust, setPointsToAdjust] = useState("0");
  const [adjustNote, setAdjustNote] = useState("");
  const [historyMember, setHistoryMember] = useState<OutletMembership | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const adjustPoints = useAdjustPoints();

  const { data, isLoading, isFetching } = useLoyaltyMembers(outletId, { search, page, limit });

  const { data: pointHistoryData, isLoading: pointHistoryLoading, isFetching: pointHistoryFetching } =
    useLoyaltyPointHistory(outletId, historyMember?.guestCustomerId || "", { page: historyPage, limit: 10 });

  useEffect(() => {
    setHistoryPage(1);
  }, [historyMember?.guestCustomerId]);

  const handleAdjustPoints = async () => {
    if (!editingMember) return;
    const pts = parseInt(pointsToAdjust);
    if (isNaN(pts) || pts === 0) {
      gooeyToast.error("Masukkan jumlah poin yang valid");
      return;
    }
    try {
      await adjustPoints.mutateAsync({
        outletId,
        guestCustomerId: editingMember.guestCustomerId,
        points: pts,
        note: adjustNote || undefined,
      });
      gooeyToast.success(`Berhasil ${pts > 0 ? "menambah" : "mengurangi"} ${Math.abs(pts)} poin`);
      setEditingMember(null);
      setPointsToAdjust("0");
      setAdjustNote("");
    } catch (error: any) {
      gooeyToast.error(error?.response?.data?.message || "Gagal menyesuaikan poin");
    }
  };

  const handlePaginationChange = useCallback(({ page: p, limit: l }: { page: number; limit: number }) => {
    setPage(p);
    setLimit(l);
  }, []);

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const members = useMemo(() => data?.members || [], [data?.members]);
  const totalItems = useMemo(() => data?.meta?.total || 0, [data?.meta?.total]);

  const exportConfig = useMemo(() => [{
    id: "csv",
    label: "Download CSV",
    icon: "file" as const,
    enabled: true,
    type: "server" as const,
    exportUrl: () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/loyalty/members/${outletId}/export`,
    filename: `loyalty-members-${outletId}`,
  }], [outletId]);

  const columns = useMemo<ColumnDef<OutletMembership>[]>(
    () => [
      {
        id: "customer",
        header: "Pelanggan",
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border border-border/40 shrink-0">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-medium truncate block">{m.customer.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{m.customer.phone}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "tier",
        header: "Tier",
        cell: ({ row }) => {
          const tier = row.original.tier;
          if (!tier) return <span className="text-xs text-muted-foreground">-</span>;
          return (
            <Badge
              variant="outline"
              className="text-[10px] font-bold uppercase"
              style={{ borderColor: tier.color + "50", backgroundColor: tier.color + "15", color: tier.color }}
            >
              <Trophy className="h-3 w-3 mr-1" />
              {tier.name}
            </Badge>
          );
        },
      },
      {
        accessorKey: "lifetimePoints",
        header: "Lifetime",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {row.original.lifetimePoints.toLocaleString("id-ID")}
          </span>
        ),
      },
      {
        accessorKey: "points",
        header: "Poin Aktif",
        cell: ({ row }) => (
          <span className="font-bold text-primary text-xs tabular-nums">
            {row.getValue<number>("points").toLocaleString("id-ID")}
          </span>
        ),
      },
      {
        accessorKey: "totalSpending",
        header: "Total Belanja",
        cell: ({ row }) => (
          <span className="font-medium text-xs tabular-nums">
            Rp {row.getValue<number>("totalSpending").toLocaleString("id-ID")}
          </span>
        ),
      },
      {
        accessorKey: "lastTransactionAt",
        header: "Terakhir",
        cell: ({ row }) => {
          const date = row.getValue<string | null>("lastTransactionAt");
          return (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 opacity-40" />
              {date ? format(new Date(date), "d MMM yyyy", { locale: localeId }) : "-"}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setEditingMember(row.original)}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Poin</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setHistoryMember(row.original)}>
              <History className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={members}
        isLoading={isLoading}
        isRefreshing={isFetching && !isLoading}
        title="Database Member"
        description="Daftar member dan perolehan poin."
        searchPlaceholder="Cari nama atau telepon..."
        serverSideSearch
        searchValue={search}
        onSearchChange={handleSearchChange}
        serverSidePagination
        totalItems={totalItems}
        serverPage={page}
        serverLimit={limit}
        onPaginationChange={handlePaginationChange}
        emptyMessage="Belum ada member terdaftar."
        enableExport
        exportConfig={exportConfig}
      />

      {/* Adjust Points Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="sm:max-w-md gap-0 p-0">
          <DialogHeader className="p-4 border-b border-border/40 bg-muted/10">
            <DialogTitle className="text-sm font-semibold">Atur Poin Member</DialogTitle>
            <DialogDescription className="text-xs">
              Sesuaikan saldo poin untuk {editingMember?.customer.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
              <span className="text-xs font-medium text-blue-600">Poin Saat Ini</span>
              <span className="text-lg font-bold text-blue-600 tabular-nums">
                {editingMember?.points.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="points" className="text-xs font-medium">
                Jumlah Perubahan
              </Label>
              <div className="relative">
                <Input
                  id="points"
                  type="number"
                  placeholder="100 atau -50"
                  value={pointsToAdjust}
                  onChange={(e) => setPointsToAdjust(e.target.value)}
                  className="h-9 pr-9"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {parseInt(pointsToAdjust) >= 0 ? (
                    <PlusCircle className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <MinusCircle className="h-4 w-4 text-rose-500" />
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Gunakan minus (-) untuk mengurangi poin.
              </p>
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-border/40 gap-2">
            <Button variant="outline" onClick={() => setEditingMember(null)}>Batal</Button>
            <Button onClick={handleAdjustPoints} disabled={adjustPoints.isPending}>
              {adjustPoints.isPending ? "Memproses..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={!!historyMember} onOpenChange={(open) => !open && setHistoryMember(null)}>
        <DialogContent className="sm:max-w-lg gap-0 p-0">
          <DialogHeader className="p-4 border-b border-border/40 bg-muted/10">
            <DialogTitle className="text-sm font-semibold">Riwayat Poin</DialogTitle>
            <DialogDescription className="text-xs">
              Log aktivitas poin {historyMember?.customer.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 max-h-80 space-y-2 overflow-y-auto">
            {pointHistoryLoading ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/20" />
              </div>
            ) : (pointHistoryData?.history?.length || 0) === 0 ? (
              <div className="py-12 text-center">
                <History className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Belum ada riwayat</p>
              </div>
            ) : (
              pointHistoryData?.history.map((item) => {
                const isMinus = item.type === "REDEEM" || item.type === "ADJUSTMENT_OUT";
                const typeLabel =
                  item.type === "EARN" ? "Dapat Poin"
                  : item.type === "REDEEM" ? "Pakai Poin"
                  : item.type === "ADJUSTMENT_IN" ? "Tambah"
                  : "Kurang";
                return (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-muted/5">
                    <div className="space-y-1 min-w-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-bold uppercase",
                          !isMinus ? "text-emerald-600 border-emerald-500/30" : "text-rose-600 border-rose-500/30"
                        )}
                      >
                        {typeLabel}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(item.createdAt), "d MMM yyyy HH:mm", { locale: localeId })}
                      </p>
                      {item.note && <p className="text-xs font-medium">{item.note}</p>}
                    </div>
                    <span className={cn("text-sm font-bold tabular-nums shrink-0", isMinus ? "text-rose-600" : "text-emerald-600")}>
                      {isMinus ? "-" : "+"}
                      {item.points.toLocaleString("id-ID")}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter className="p-3 border-t border-border/40 gap-2">
            <div className="flex items-center gap-2 mr-auto">
              {pointHistoryFetching && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              <span className="text-[10px] text-muted-foreground">
                {pointHistoryData?.meta.total || 0} riwayat
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setHistoryPage((p) => Math.max(1, p - 1))} disabled={historyPage <= 1}>
              Prev
            </Button>
            <Button variant="outline" size="sm" onClick={() => setHistoryPage((p) => p + 1)} disabled={historyPage >= (pointHistoryData?.meta.totalPages || 1)}>
              Next
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
