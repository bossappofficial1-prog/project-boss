"use client";

export function ExpensesEmptyState() {
	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
			<svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 0V4m0 8v8" />
			</svg>
			<h3 className="text-gray-900 dark:text-gray-100 font-semibold">Belum ada pengeluaran</h3>
			<p className="text-gray-500 dark:text-gray-400">Tambahkan pengeluaran pertama Anda</p>
		</div>
	);
}

export default ExpensesEmptyState;

