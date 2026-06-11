"use client";

import { useCallback, useState } from 'react';
import { useOutletStore } from '@/stores/outlet.store';
import { useExpenses } from '@/hooks/use-expenses';
import { ExpensesHeader } from '@/features/expenses/components/owner/header';
import { ExpensesControls } from '@/features/expenses/components/owner/controls';
import { ExpensesDesktopTable } from '@/features/expenses/components/owner/desktop-table';
import { ExpensesEmptyState } from '@/features/expenses/components/owner/empty-state';
import { ExpensesSkeleton } from '@/features/expenses/components/owner/skeleton';
import { ExpenseFormDialog } from '@/features/expenses';
import { type Expense } from '@/hooks/api/use-expenses';
import { toast } from 'sonner';
import { uploadApi } from '@/lib/api';
import { apiClient } from '@/lib/apis/base';
import { ReceiptPreviewModal } from '@/components/modals/receipt-preview-modal';
import { SectionHeader } from '@/components/ui/section-header';
import { Receipt, Wallet, Plus, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function ExpensesPage() {
	const { selectedOutletId: outletId } = useOutletStore();
	const { expenses, summary, loading, error, startISO, endISO, setRange, refetch, create, update, remove } = useExpenses(outletId);
	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<Expense | null>(null);
	const [scanning, setScanning] = useState(false);

	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [previewOpen, setPreviewOpen] = useState(false);

	const handleAdd = () => {
		setEditing(null);
		setModalOpen(true);
	};

	const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setScanning(true);
		const toastId = toast.loading("Memindai struk belanja dengan Gemini AI...");
		
		try {
			const fd = new FormData();
			fd.append("receipt", file);
			fd.append("outletId", outletId!);

			await apiClient.post("/expenses/scan-receipt", fd, {
				headers: {
					"Content-Type": "multipart/form-data"
				}
			});

			toast.success("Struk berhasil dipindai dan dicatat sebagai pengeluaran otomatis!", { id: toastId });
			refetch();
		} catch (err: any) {
			const msg = err?.response?.data?.message || err?.message || "Gagal memindai struk";
			toast.error(msg, { id: toastId });
		} finally {
			setScanning(false);
			e.target.value = "";
		}
	};

	const handleEdit = (exp: Expense) => {
		setEditing(exp);
		setModalOpen(true);
	};

	const handleDelete = async (exp: Expense) => {
		const ok = window.confirm(`Hapus pengeluaran: ${exp.description}?`);
		if (!ok) return;
		try {
			await remove(exp.id);
			toast.success("Pengeluaran berhasil dihapus");
		} catch (error: any) {
			toast.error(error?.message || "Gagal menghapus pengeluaran");
		}
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
		<div className="space-y-6 animate-in fade-in duration-500">
			{/* ══════════ Page Header ══════════ */}
			<SectionHeader
				title="Pengeluaran Outlet"
				description="Kelola biaya operasional harian, gaji staf, dan modal inventaris Anda."
				actions={
					<div className="flex items-center gap-2">
						<input
							type="file"
							id="scan-receipt-input"
							accept="image/*"
							className="hidden"
							onChange={handleScanReceipt}
							disabled={scanning || !outletId}
						/>
						<Button
							variant="outline"
							onClick={() => document.getElementById("scan-receipt-input")?.click()}
							disabled={scanning || !outletId}
							size="lg"
						>
							{scanning ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Sparkles className="w-4 h-4" />
							)}
							Scan Struk (AI)
						</Button>
						<Button onClick={handleAdd} disabled={scanning || !outletId} size="lg">
							<Plus className="w-4 h-4" />
							Tambah Pengeluaran
						</Button>
					</div>
				}
			/>

			{/* ══════════ Metrics & Controls ══════════ */}
			{/* ══════════ Metrics & Controls ══════════ */}
			<Card className="rounded-md border-border/80 bg-background shadow-sm p-1 pl-4 flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all">
				<div className="flex flex-col sm:flex-row sm:items-center gap-6 py-2">
					{/* Metrik Terintegrasi */}
					<div className="flex items-center gap-3">
						<div className="w-1 h-8 rounded-full bg-rose-500/80" />
						<div>
							<p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground opacity-60 mb-0.5">Total Pengeluaran</p>
							<p className="text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums leading-none">
								{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(summary.totalPengeluaran)}
							</p>
						</div>
					</div>

					<div className="hidden sm:block h-10 w-px bg-border/40" />

					{/* Kontrol Tanggal */}
					<div className="flex-1">
						<ExpensesControls
							startISO={startISO}
							endISO={endISO}
							onRangeChange={setRange}
							hideAddButton={true}
						/>
					</div>
				</div>

				<div className="flex items-center gap-2 pr-2">
					<Button
						variant="ghost"
						size="icon"
						onClick={refetch}
					>
						<Loader2 className={cn("w-4 h-4", loading && "animate-spin")} />
					</Button>
				</div>
			</Card>

			{error && (
				<div className="bg-rose-500/10 border border-rose-500/20 rounded-md p-4 flex items-center gap-3 text-rose-600">
					<Receipt className="w-4 h-4" />
					<p className="text-xs font-bold">{error}</p>
					<Button onClick={refetch} variant="ghost" size="sm">
						Coba Lagi
					</Button>
				</div>
			)}

			<ExpensesDesktopTable
				items={expenses as any}
				isLoading={loading}
				onEdit={handleEdit as any}
				onDelete={handleDelete as any}
				onPreviewImage={(url) => {
					setPreviewUrl(url);
					setPreviewOpen(true);
				}}
			/>
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
	);
}
