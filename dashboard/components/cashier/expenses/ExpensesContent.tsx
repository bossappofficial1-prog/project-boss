"use client";

import { useCallback, useMemo, useState } from "react";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { toast } from "sonner";
import {
    CalendarIcon,
    Plus,
    RefreshCw,
    Receipt,
    PenLine,
    Trash2,
    TrendingDown,
} from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";

import {
    useExpenseList,
    useCreateExpense,
    useUpdateExpense,
    useDeleteExpense,
    type Expense,
} from "@/hooks/api/use-expenses";
import { ExpenseFormDialog } from "./ExpenseFormDialog";

interface ExpensesContentProps {
    outletId: string;
    cashierName: string;
}

function toISOStart(d: Date): string {
    const clone = new Date(d);
    clone.setHours(0, 0, 0, 0);
    return clone.toISOString();
}

function toISOEnd(d: Date): string {
    const clone = new Date(d);
    clone.setHours(23, 59, 59, 999);
    return clone.toISOString();
}

function formatCurrency(n: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(n);
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatTime(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

const expenseColumns = [
    {
        accessorKey: "date" as const,
        header: "Tanggal",
        cell: (info: any) => {
            const val = info.getValue() as string;
            return (
                <div>
                    <p className="font-medium">{formatDate(val)}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(val)}</p>
                </div>
            );
        },
    },
    {
        accessorKey: "description" as const,
        header: "Deskripsi",
        enableSorting: false,
    },
    {
        accessorKey: "cashier" as const,
        header: "Kasir",
        cell: (info: any) => (
            <Badge variant="outline" className="text-xs">
                {(info.getValue() as string) ?? "—"}
            </Badge>
        ),
    },
    {
        accessorKey: "amount" as const,
        header: "Jumlah",
        cell: (info: any) => (
            <span className="font-semibold text-red-600 dark:text-red-400">
                -{formatCurrency(info.getValue() as number)}
            </span>
        ),
    },
];

export function ExpensesContent({ outletId, cashierName }: ExpensesContentProps) {
    const weekAgo = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        return d;
    }, []);
    const today = useMemo(() => new Date(), []);

    const [startDate, setStartDate] = useState(weekAgo);
    const [endDate, setEndDate] = useState(today);
    const [calOpen, setCalOpen] = useState(false);

    const startISO = useMemo(() => toISOStart(startDate), [startDate]);
    const endISO = useMemo(() => toISOEnd(endDate), [endDate]);

    const { data, isLoading, refetch } = useExpenseList(outletId, startISO, endISO);
    const createMutation = useCreateExpense();
    const updateMutation = useUpdateExpense();
    const deleteMutation = useDeleteExpense();

    const expenses = data?.data ?? [];
    const summary = data?.summary ?? { totalTransaksi: 0, totalPengeluaran: 0 };

    // Form dialog
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Expense | null>(null);

    // Delete confirm
    const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const handleAdd = useCallback(() => {
        setEditing(null);
        setFormOpen(true);
    }, []);

    const handleEdit = useCallback((exp: Expense) => {
        setEditing(exp);
        setFormOpen(true);
    }, []);

    const handleDeleteClick = useCallback((exp: Expense) => {
        setDeleteTarget(exp);
        setDeleteOpen(true);
    }, []);

    const handleFormSubmit = useCallback(
        async (formData: { description: string; amount: number; date: string }, id?: string) => {
            try {
                if (id) {
                    await updateMutation.mutateAsync({ id, ...formData });
                    toast.success("Pengeluaran berhasil diperbarui");
                } else {
                    await createMutation.mutateAsync({
                        ...formData,
                        outletId,
                        cashier: cashierName,
                    });
                    toast.success("Pengeluaran berhasil ditambahkan");
                }
                setFormOpen(false);
            } catch (error: any) {
                const msg = error?.response?.data?.message ?? error?.message ?? "Gagal menyimpan pengeluaran";
                toast.error(msg);
            }
        },
        [outletId, cashierName, createMutation, updateMutation],
    );

    const handleDeleteConfirm = useCallback(async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            toast.success("Pengeluaran berhasil dihapus");
            setDeleteOpen(false);
            setDeleteTarget(null);
        } catch (error: any) {
            const msg = error?.response?.data?.message ?? error?.message ?? "Gagal menghapus";
            toast.error(msg);
        }
    }, [deleteTarget, deleteMutation]);

    const handleRangeSelect = useCallback((range?: DateRange) => {
        if (!range?.from) return;
        setStartDate(range.from);
        setEndDate(range.to ?? range.from);
        if (range.to) setCalOpen(false);
    }, []);

    const selectedRange = useMemo<DateRange>(
        () => ({ from: startDate, to: endDate }),
        [startDate, endDate],
    );

    if (isLoading) return <ExpensesSkeleton />;

    return (
        <div className="mx-auto max-w-[1200px] p-4 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        Pengeluaran
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Catat dan kelola pengeluaran outlet
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button size="sm" onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-md bg-red-100 dark:bg-red-900/30">
                            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Total Pengeluaran</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {formatCurrency(summary.totalPengeluaran)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-md bg-blue-100 dark:bg-blue-900/30">
                            <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Total Transaksi</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                {summary.totalTransaksi}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Date Range Picker */}
            <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                <Popover open={calOpen} onOpenChange={setCalOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left h-auto py-2">
                            <CalendarIcon className="w-4 h-4 mr-3 text-slate-400 shrink-0" />
                            <span className="text-sm font-medium">
                                {format(startDate, "d MMM yyyy", { locale: localeID })}
                                {" — "}
                                {format(endDate, "d MMM yyyy", { locale: localeID })}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="range"
                            numberOfMonths={1}
                            selected={selectedRange}
                            defaultMonth={startDate}
                            onSelect={handleRangeSelect}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Expense Table */}
            <DataTable
                data={expenses}
                columns={expenseColumns}
                isLoading={isLoading}
                emptyMessage="Belum ada pengeluaran pada periode ini"
                stickyHeader
                enableExport
                exportFilename="data-pengeluaran"

                mobileCardRender={(exp: Expense) => (
                    <div className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">
                                    {exp.description}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">
                                        {formatDate(exp.date)} {formatTime(exp.date)}
                                    </span>
                                    <Badge variant="outline" className="text-[10px]">
                                        {exp.cashier ?? "—"}
                                    </Badge>
                                </div>
                            </div>
                            <p className="text-sm font-semibold text-red-600 dark:text-red-400 whitespace-nowrap shrink-0">
                                -{formatCurrency(exp.amount)}
                            </p>
                        </div>
                    </div>
                )}
            />

            {/* Form Dialog */}
            <ExpenseFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                initial={editing}
                isLoading={createMutation.isPending || updateMutation.isPending}
                onSubmit={handleFormSubmit}
            />

            {/* Delete Confirm */}
            <ConfirmDialog
                open={deleteOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteOpen(false);
                        setDeleteTarget(null);
                    }
                }}
                title="Hapus Pengeluaran"
                description={`Apakah Anda yakin ingin menghapus pengeluaran "${deleteTarget?.description ?? ""}"?`}
                confirmLabel="Hapus"
                confirmVariant="destructive"
                confirmLoading={deleteMutation.isPending}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}

function ExpensesSkeleton() {
    return (
        <div className="mx-auto max-w-[1200px] p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-20 rounded-md" />
                <Skeleton className="h-20 rounded-md" />
            </div>
            <Skeleton className="h-12 rounded-md" />
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-md" />
                ))}
            </div>
        </div>
    );
}
