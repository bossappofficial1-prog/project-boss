"use client";

import { DataTable } from '@/components/ui/data-table';
import { type Expense } from '@/lib/apis/expense';
import { PenBox, Trash2 } from 'lucide-react';
import ExpensesMobileCards from './MobileCards';
import { formatCurrency } from '@/lib/utils';

interface ExpensesDesktopTableProps {
	items: Expense[];
	onEdit: (exp: Expense) => void;
	onDelete: (exp: Expense) => void;
}

const fmtDate = (iso: string) => new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

export function ExpensesDesktopTable({ items, onEdit, onDelete }: ExpensesDesktopTableProps) {
	return (
		<DataTable
			data={items}
			columns={[
				{
					accessorKey: 'date',
					header: 'Tanggal',
					cell: (info) => fmtDate(info.getValue() as string)
				},
				{
					accessorKey: 'description',
					header: 'Deskripsi',
					enableSorting: false
				},
				{
					accessorKey: 'amount',
					header: 'Jumlah',
					cell: (amount) => formatCurrency(amount.getValue() as number),
				}
			]}
			rowActions={() => {
				return [
					{
						label: 'Edit',
						onClick: (row: Expense) => onEdit(row),
						variant: 'ghost',
						icon: PenBox
					},
					{
						label: 'Hapus',
						onClick(row) {
							onDelete(row)
						},
						icon: Trash2,
						variant: 'destructive'
					}
				]
			}}
			stickyHeader
			enableExport
			exportFilename='data-pengeluaran'
			labelAction='Aksi'
			mobileCardRender={(exp) => <ExpensesMobileCards item={exp} onDelete={onDelete} onEdit={onEdit} />}
		/>
	);
}

export default ExpensesDesktopTable;

