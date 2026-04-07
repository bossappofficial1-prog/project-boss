import React from "react";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { type OutletMembership } from "@/lib/apis/loyalty";
import { useLoyaltyMembers, useAdjustPoints, useLoyaltyPointHistory } from "@/hooks/api/use-loyalty";
import { Badge } from "@/components/ui/badge";
import { User, Trophy, Calendar, PlusCircle, MinusCircle, History } from "lucide-react";
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

export function LoyaltyMembersTable({ outletId }: { outletId: string }) {
    const [search, setSearch] = React.useState("");
    const [page, setPage] = React.useState(1);
    const [limit, setLimit] = React.useState(10);

    // State for Adjust Points Dialog
    const [editingMember, setEditingMember] = React.useState<OutletMembership | null>(null);
    const [pointsToAdjust, setPointsToAdjust] = React.useState<string>("0");
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
            });
            toast.success(`Berhasil ${pts > 0 ? "menambah" : "mengurangi"} ${Math.abs(pts)} poin`);
            setEditingMember(null);
            setPointsToAdjust("0");
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
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <User className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {m.customer.name}
                            </span>
                            <span className="text-xs text-slate-500">{m.customer.phone}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "tier",
            header: "Tier",
            cell: ({ row }) => (
                <Badge variant="secondary" className="gap-1 font-medium bg-primary/10 text-primary">
                    <Trophy className="h-3 w-3" />
                    {row.getValue("tier")}
                </Badge>
            )
        },
        {
            accessorKey: "points",
            header: () => <div className="">Total Poin</div>,
            cell: ({ row }) => (
                <div className="font-bold text-primary">
                    {row.getValue<number>("points").toLocaleString("id-ID")}
                </div>
            )
        },
        {
            accessorKey: "totalSpending",
            header: () => <div className="">Total Belanja</div>,
            cell: ({ row }) => (
                <div className="font-medium ">
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
                    <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="h-3 w-3" />
                        {date ? format(new Date(date), "d MMM yyyy", { locale: localeId }) : "-"}
                    </div>
                );
            }
        },
        {
            id: "actions",
            header: () => <div className="">Aksi</div>,
            cell: ({ row }) => (
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        onClick={() => setEditingMember(row.original)}
                    >
                        <PlusCircle className="h-4 w-4" />
                        Atur Poin
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                        onClick={() => setHistoryMember(row.original)}
                    >
                        <History className="h-4 w-4" />
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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Atur Poin Member</DialogTitle>
                        <DialogDescription>
                            Tambahkan atau kurangi poin untuk {editingMember?.customer.name}.
                            Gunakan tanda minus (-) untuk mengurangi poin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Poin Saat Ini:</span>
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {editingMember?.points.toLocaleString("id-ID")}
                            </span>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="points">Jumlah Poin (Contoh: 100 atau -50)</Label>
                            <div className="relative">
                                <Input
                                    id="points"
                                    type="number"
                                    value={pointsToAdjust}
                                    onChange={(e) => setPointsToAdjust(e.target.value)}
                                    className="pr-10"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {parseInt(pointsToAdjust) >= 0 ? (
                                        <PlusCircle className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <MinusCircle className="h-4 w-4 text-red-500" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingMember(null)}>Batal</Button>
                        <Button
                            onClick={handleAdjustPoints}
                            disabled={adjustPoints.isPending}
                            className="bg-blue-600 hover:bg-blue-500"
                        >
                            {adjustPoints.isPending ? "Memproses..." : "Simpan Perubahan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!historyMember} onOpenChange={(open) => !open && setHistoryMember(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Riwayat Poin Member</DialogTitle>
                        <DialogDescription>
                            Riwayat penggunaan dan perubahan poin untuk {historyMember?.customer.name}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                        {pointHistoryLoading ? (
                            <p className="text-sm text-slate-500">Memuat riwayat poin...</p>
                        ) : (pointHistoryData?.history?.length || 0) === 0 ? (
                            <p className="text-sm text-slate-500">Belum ada riwayat poin untuk member ini.</p>
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
                                        className="flex items-start justify-between rounded-md border border-slate-200 p-3 dark:border-slate-800"
                                    >
                                        <div className="space-y-1">
                                            <Badge variant="secondary" className="rounded-md">
                                                {typeLabel}
                                            </Badge>
                                            <p className="text-xs text-slate-500">
                                                {format(new Date(item.createdAt), "d MMM yyyy HH:mm", {
                                                    locale: localeId,
                                                })}
                                            </p>
                                            {item.note && (
                                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                                    {item.note}
                                                </p>
                                            )}
                                            {item.order?.id && (
                                                <p className="text-xs text-slate-500">Order: {item.order.id}</p>
                                            )}
                                        </div>
                                        <div
                                            className={`text-sm font-semibold ${isMinus
                                                    ? "text-red-600 dark:text-red-400"
                                                    : "text-emerald-600 dark:text-emerald-400"
                                                }`}
                                        >
                                            {isMinus ? "-" : "+"}
                                            {item.points.toLocaleString("id-ID")} poin
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
                        <p className="text-xs text-slate-500">
                            {pointHistoryFetching ? "Memperbarui..." : `Total riwayat: ${pointHistoryData?.meta.total || 0}`}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                                disabled={historyPage <= 1 || pointHistoryLoading}
                            >
                                Sebelumnya
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
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
