import React from "react";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { type OutletMembership } from "@/lib/apis/loyalty";
import { useLoyaltyMembers, useAdjustPoints } from "@/hooks/api/use-loyalty";
import { Badge } from "@/components/ui/badge";
import { User, Trophy, Calendar, PlusCircle, MinusCircle } from "lucide-react";
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
    const adjustPoints = useAdjustPoints();

    const { data, isLoading, isFetching } = useLoyaltyMembers(outletId, {
        search,
        page,
        limit,
    });

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
                <div className="flex">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        onClick={() => setEditingMember(row.original)}
                    >
                        <PlusCircle className="h-4 w-4" />
                        Atur Poin
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
                <DialogContent className="sm:max-w-[425px]">
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
        </>
    );
}
