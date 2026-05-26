import React from "react";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { type OutletMembership } from "@/lib/apis/loyalty";
import { useLoyaltyMembers, useAdjustPoints, useLoyaltyPointHistory } from "@/hooks/api/use-loyalty";
import { Badge } from "@/components/ui/badge";
import { User, Trophy, Calendar, PlusCircle, MinusCircle, History, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function LoyaltyMembersTable({ outletId }: { outletId: string }) {
    const [search, setSearch] = React.useState("");
    const [page, setPage] = React.useState(1);
    const [limit, setLimit] = React.useState(10);

    // State for Adjust Points Dialog
    const [editingMember, setEditingMember] = React.useState<OutletMembership | null>(null);
    const [pointsToAdjust, setPointsToAdjust] = React.useState<string>("0");
    const [adjustNote, setAdjustNote] = React.useState<string>("");
    const [historyMember, setHistoryMember] = React.useState<OutletMembership | null>(null);
    const [historyPage, setHistoryPage] = React.useState(1);
    const adjustPoints = useAdjustPoints();

    const { data, isLoading, isFetching } = useLoyaltyMembers(outletId, {
        search,
        page,
        limit,
    });

    const {
        data: pointHistoryData,
        isLoading: pointHistoryLoading,
        isFetching: pointHistoryFetching,
    } = useLoyaltyPointHistory(outletId, historyMember?.guestCustomerId || "", {
        page: historyPage,
        limit: 10,
    });

    React.useEffect(() => {
        setHistoryPage(1);
    }, [historyMember?.guestCustomerId]);

    const handleAdjustPoints = async () => {
        if (!editingMember) return;
        const pts = parseInt(pointsToAdjust);
        if (isNaN(pts) || pts === 0) {
            toast.error("Masukkan jumlah poin yang valid");
            return;
        }

        try {
            await adjustPoints.mutateAsync({
                outletId,
                guestCustomerId: editingMember.guestCustomerId,
                points: pts,
                note: adjustNote || undefined,
            });
            toast.success(`Berhasil ${pts > 0 ? "menambah" : "mengurangi"} ${Math.abs(pts)} poin`);
            setEditingMember(null);
            setPointsToAdjust("0");
            setAdjustNote("");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Gagal menyesuaikan poin");
        }
    };

    const columns = React.useMemo<ColumnDef<OutletMembership>[]>(() => [
        {
            id: "customer",
            header: "Pelanggan",
            cell: ({ row }) => {
                const m = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/50 border border-border/40 text-foreground/60 shadow-sm">
                            <User className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-foreground/90 tracking-tight">
                                {m.customer.name}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground tabular-nums">{m.customer.phone}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "tier",
            header: "Tier",
            cell: ({ row }) => {
                const tier = row.original.tier;
                if (!tier) {
                    return <span className="text-xs text-muted-foreground italic">—</span>;
                }
                return (
                    <Badge
                        variant="outline"
                        className="gap-1.5 font-bold text-[10px] uppercase tracking-wider px-2 py-0 shadow-none"
                        style={{ borderColor: tier.color + "50", backgroundColor: tier.color + "15", color: tier.color }}
                    >
                        <Trophy className="h-3 w-3" />
                        {tier.name}
                    </Badge>
                );
            }
        },
        {
            accessorKey: "lifetimePoints",
            header: "Lifetime Poin",
            cell: ({ row }) => (
                <div className="font-mono text-xs text-muted-foreground tabular-nums">
                    {row.original.lifetimePoints.toLocaleString("id-ID")}
                </div>
            )
        },
        {
            accessorKey: "points",
            header: "Poin Aktif",
            cell: ({ row }) => (
                <div className="font-bold text-primary tabular-nums">
                    {row.getValue<number>("points").toLocaleString("id-ID")}
                </div>
            )
        },
        {
            accessorKey: "totalSpending",
            header: "Total Belanja",
            cell: ({ row }) => (
                <div className="font-bold text-foreground/80 tabular-nums text-xs">
                    Rp {row.getValue<number>("totalSpending").toLocaleString("id-ID")}
                </div>
            )
        },
        {
            accessorKey: "lastTransactionAt",
            header: "Transaksi Terakhir",
            cell: ({ row }) => {
                const date = row.getValue<string | null>("lastTransactionAt");
                return (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground tabular-nums">
                        <Calendar className="h-3 w-3 opacity-40" />
                        {date ? format(new Date(date), "d MMM yyyy", { locale: localeId }) : <span className="opacity-30 italic">-</span>}
                    </div>
                );
            }
        },
        {
            id: "actions",
            header: "Aksi",
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 font-bold text-[10px] uppercase tracking-wider border-border/60 hover:bg-muted/50 transition-all shadow-none px-3"
                        onClick={() => setEditingMember(row.original)}
                    >
                        <PlusCircle className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                        Atur Poin
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 font-bold text-[10px] uppercase tracking-wider border-border/60 hover:bg-muted/50 transition-all shadow-none px-3"
                        onClick={() => setHistoryMember(row.original)}
                    >
                        <History className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                        Riwayat
                    </Button>
                </div>
            )
        }
    ], [outletId]);

    return (
        <>
            <DataTable
                columns={columns}
                data={data?.members || []}
                isLoading={isLoading}
                isRefreshing={isFetching && !isLoading}
                title="Database Member"
                description="Daftar seluruh member di outlet ini beserta perolehan poin mereka."
                searchPlaceholder="Cari nama atau telepon..."
                serverSideSearch
                searchValue={search}
                onSearchChange={(val) => {
                    setSearch(val);
                    setPage(1);
                }}
                serverSidePagination
                totalItems={data?.meta?.total || 0}
                serverPage={page}
                serverLimit={limit}
                onPaginationChange={(params) => {
                    setPage(params.page);
                    setLimit(params.limit);
                }}
                emptyMessage="Belum ada member terdaftar di outlet ini."
            />

            <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
                <DialogContent className="sm:max-w-md gap-0 p-0 border-border/80 shadow-2xl overflow-hidden">
                    <DialogHeader className="p-6 border-b border-border/40 bg-muted/30">
                        <DialogTitle className="text-sm font-bold uppercase tracking-widest text-foreground/90">Atur Poin Member</DialogTitle>
                        <DialogDescription className="text-[10px] font-medium uppercase tracking-tighter opacity-70">
                            Sesuaikan saldo poin untuk {editingMember?.customer.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between rounded-md border border-blue-500/20 bg-blue-500/5 p-4 shadow-sm">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600/70">Poin Saat Ini</span>
                            <span className="text-xl font-bold text-blue-600 tabular-nums">
                                {editingMember?.points.toLocaleString("id-ID")}
                            </span>
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="points" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Jumlah Perubahan Poin</Label>
                            <div className="relative">
                                <Input
                                    id="points"
                                    type="number"
                                    placeholder="Contoh: 100 atau -50"
                                    value={pointsToAdjust}
                                    onChange={(e) => setPointsToAdjust(e.target.value)}
                                    className="h-11 pl-4 pr-12 border-border/60 bg-background/50 focus:bg-background transition-all rounded-md font-bold text-sm tabular-nums"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-muted/50 border border-border/40">
                                    {parseInt(pointsToAdjust) >= 0 ? (
                                        <PlusCircle className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <MinusCircle className="h-4 w-4 text-rose-500" />
                                    )}
                                </div>
                            </div>
                            <p className="text-[10px] font-medium text-muted-foreground/60 italic px-1">
                                * Gunakan tanda minus (-) untuk mengurangi poin pelanggan.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="p-4 border-t border-border/40 bg-muted/5 gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setEditingMember(null)} className="h-9 font-bold text-xs uppercase tracking-wider border-border/60 shadow-none">Batal</Button>
                        <Button
                            onClick={handleAdjustPoints}
                            disabled={adjustPoints.isPending}
                            className="h-9 font-bold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-500 shadow-none"
                        >
                            {adjustPoints.isPending ? "Memproses..." : "Simpan Perubahan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!historyMember} onOpenChange={(open) => !open && setHistoryMember(null)}>
                <DialogContent className="sm:max-w-2xl gap-0 p-0 border-border/80 shadow-2xl overflow-hidden">
                    <DialogHeader className="p-6 border-b border-border/40 bg-muted/30">
                        <DialogTitle className="text-sm font-bold uppercase tracking-widest text-foreground/90">Riwayat Poin Member</DialogTitle>
                        <DialogDescription className="text-[10px] font-medium uppercase tracking-tighter opacity-70">
                            Log aktivitas dan perubahan poin untuk {historyMember?.customer.name}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 max-h-96 space-y-3 overflow-y-auto custom-scrollbar">
                        {pointHistoryLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground opacity-20" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">Memuat riwayat...</p>
                            </div>
                        ) : (pointHistoryData?.history?.length || 0) === 0 ? (
                            <div className="py-20 rounded-md border border-dashed border-border/60 flex flex-col items-center justify-center text-center">
                                <History className="h-10 w-10 text-muted-foreground/20 mb-4" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Belum ada riwayat poin</p>
                            </div>
                        ) : (
                            pointHistoryData?.history.map((item) => {
                                const isMinus = item.type === "REDEEM" || item.type === "ADJUSTMENT_OUT";
                                const typeLabel =
                                    item.type === "EARN"
                                        ? "Dapat Poin"
                                        : item.type === "REDEEM"
                                            ? "Pakai Poin"
                                            : item.type === "ADJUSTMENT_IN"
                                                ? "Penyesuaian +"
                                                : "Penyesuaian -";

                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between rounded-md border border-border/60 bg-muted/5 p-4 transition-all hover:bg-muted/10"
                                    >
                                        <div className="space-y-1.5">
                                            <Badge variant="outline" className={cn(
                                                "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0 shadow-none border-opacity-20",
                                                !isMinus ? "bg-emerald-500/10 text-emerald-600 border-emerald-500" : "bg-rose-500/10 text-rose-600 border-rose-500"
                                            )}>
                                                {typeLabel}
                                            </Badge>
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-[10px] font-medium text-muted-foreground tabular-nums opacity-70">
                                                    {format(new Date(item.createdAt), "d MMM yyyy HH:mm", {
                                                        locale: localeId,
                                                    })}
                                                </p>
                                                {item.note && (
                                                    <p className="text-xs font-bold text-foreground/80">
                                                        {item.note}
                                                    </p>
                                                )}
                                                {item.order?.id && (
                                                    <p className="text-[9px] font-medium text-muted-foreground italic">Order ID: #{item.order.id.slice(-8).toUpperCase()}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div
                                            className={`text-sm font-bold tabular-nums ${isMinus
                                                ? "text-rose-600"
                                                : "text-emerald-600"
                                                }`}
                                        >
                                            {isMinus ? "-" : "+"}
                                            {item.points.toLocaleString("id-ID")}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <DialogFooter className="p-4 border-t border-border/40 bg-muted/5 flex items-center justify-between gap-2 sm:justify-between">
                        <div className="flex items-center gap-2">
                            <div className={cn("h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse", pointHistoryFetching ? "opacity-100" : "opacity-0")} />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                {pointHistoryFetching ? "Memperbarui..." : `Total riwayat: ${pointHistoryData?.meta.total || 0}`}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 font-bold text-[10px] uppercase tracking-wider border-border/60 shadow-none px-3"
                                onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                                disabled={historyPage <= 1 || pointHistoryLoading}
                            >
                                Sebelumnya
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 font-bold text-[10px] uppercase tracking-wider border-border/60 shadow-none px-3"
                                onClick={() => setHistoryPage((prev) => prev + 1)}
                                disabled={
                                    pointHistoryLoading ||
                                    historyPage >= (pointHistoryData?.meta.totalPages || 1)
                                }
                            >
                                Selanjutnya
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
