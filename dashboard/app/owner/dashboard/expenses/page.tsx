"use client";

import { useCallback, useState } from 'react';
import { useOutletContext } from '@/components/providers/OutletProvider';
import { useExpenses } from '@/hooks/useExpenses';
import { ExpensesHeader } from '@/components/owner/expenses/Header';
import { ExpensesControls } from '@/components/owner/expenses/Controls';
import { ExpensesDesktopTable } from '@/components/owner/expenses/DesktopTable';
import { ExpensesEmptyState } from '@/components/owner/expenses/EmptyState';
import { ExpensesSkeleton } from '@/components/owner/expenses/Skeleton';
import { ExpenseFormDialog } from '@/components/cashier/expenses/ExpenseFormDialog';
import { type Expense } from '@/hooks/api/use-expenses';
import { toast } from 'sonner';
import { uploadApi } from '@/lib/api';
import { ReceiptPreviewModal } from '@/components/modals/ReceiptPreviewModal';

export default function ExpensesPage() {
	const { selectedOutletId: outletId } = useOutletContext();
	const { expenses, summary, loading, error, startISO, endISO, setRange, refetch, create, update, remove } = useExpenses(outletId);
	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<Expense | null>(null);

	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [previewOpen, setPreviewOpen] = useState(false);

	const handleAdd = () => {
		setEditing(null);
		setModalOpen(true);
	};

	const handleEdit = (exp: Expense) => {
		setEditing(exp);
		setModalOpen(true);
	};

	const handleDelete = async (exp: Expense) => {
		const ok = window.confirm(`Hapus pengeluaran: ${exp.description}?`);
		if (!ok) return;
		await remove(exp.id);
	};

	const handleFormSubmit = useCallback(
		async (formData: { description: string; amount: number; date: string; receiptUrl?: string | null }, id?: string) => {
			try {
				if (id) {
					await update(id, formData);
					toast.success("Pengeluaran berhasil diperbarui");
				} else {
					await create({
						...formData,
						outletId: outletId!
					});
					toast.success("Pengeluaran berhasil ditambahkan");
				}
				setModalOpen(false);
			} catch (error: any) {
				const msg = error?.response?.data?.message ?? error?.message ?? "Gagal menyimpan pengeluaran";
				toast.error(msg);
				formData.receiptUrl && await uploadApi.deleteByUrl(formData.receiptUrl)
			}
		},
		[outletId, create, update],
	);

	return (
		<>
			<div className="space-y-6">
				<ExpensesHeader saldo={summary.totalPengeluaran} onRefresh={refetch} />

				<div className="bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/70 dark:border-gray-700/70 p-4 sm:p-6">
					<ExpensesControls startISO={startISO} endISO={endISO} onRangeChange={setRange} onAdd={handleAdd} />
				</div>

				{loading ? (
					<ExpensesSkeleton />
				) : error ? (
					<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">{error}</div>
				) : expenses.length === 0 ? (
					<ExpensesEmptyState />
				) : (
					<>
						<ExpensesDesktopTable
							items={expenses as any}
							onEdit={handleEdit as any}
							onDelete={handleDelete as any}
							onPreviewImage={(url) => {
								setPreviewUrl(url);
								setPreviewOpen(true);
							}}
						/>
					</>
				)}

				<ExpenseFormDialog
					open={modalOpen}
					onOpenChange={setModalOpen}
					initial={editing as any}
					onSubmit={handleFormSubmit}
				/>

				<ReceiptPreviewModal
					open={previewOpen}
					onOpenChange={setPreviewOpen}
					imageUrl={previewUrl}
				/>
			</div>
		</>
	);
}

