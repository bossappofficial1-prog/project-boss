"use client";

import { type Expense } from '@/lib/apis/expense';

interface ExpensesDesktopTableProps {
	items: Expense[];
	onEdit: (exp: Expense) => void;
	onDelete: (exp: Expense) => void;
}

const fmtCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const fmtDate = (iso: string) => new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

export function ExpensesDesktopTable({ items, onEdit, onDelete }: ExpensesDesktopTableProps) {
	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="bg-gray-50 dark:bg-gray-900">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tanggal</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deskripsi</th>
							<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jumlah</th>
							<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
						</tr>
					</thead>
					<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
						{items.map((e) => (
							<tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{fmtDate(e.date)}</td>
								<td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{e.description}</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-gray-100">{fmtCurrency(e.amount)}</td>
								<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<div className="flex items-center gap-2 justify-end">
										<button
											onClick={() => onEdit(e)}
											className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
											title="Edit"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M7.5 20.5l-4 1 1-4L15 7l4 4-11.5 9.5z" />
											</svg>
										</button>
										<button
											onClick={() => onDelete(e)}
											className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
											title="Hapus"
										>
											<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

export default ExpensesDesktopTable;

