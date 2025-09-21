"use client";

interface ExpensesHeaderProps {
	saldo: number;
	onRefresh: () => void;
}

const fmtCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export function ExpensesHeader({ saldo, onRefresh }: ExpensesHeaderProps) {
	return (
		<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pengeluaran</h1>
				<p className="text-gray-600 dark:text-gray-400 mt-1">Catat dan kelola pengeluaran outlet Anda</p>
			</div>
			<div className="flex items-center gap-3">
				<div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg">
					<div className="text-xs text-gray-500 dark:text-gray-400">Total Pengeluaran</div>
					<div className="text-base font-semibold text-gray-900 dark:text-gray-100">{fmtCurrency(saldo)}</div>
				</div>
				<button
					onClick={onRefresh}
					className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
					title="Refresh data"
				>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					<span className="hidden sm:inline">Refresh</span>
				</button>
			</div>
		</div>
	);
}

export default ExpensesHeader;

