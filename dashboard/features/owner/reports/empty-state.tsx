"use client";

export function ReportsEmptyState() {
	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
			<svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 018 0v2m-6-6h.01M12 20h9" />
			</svg>
			<h3 className="text-gray-900 dark:text-gray-100 font-semibold">Tidak ada data</h3>
			<p className="text-gray-500 dark:text-gray-400">Silakan ubah rentang tanggal untuk melihat laporan</p>
		</div>
	);
}

export default ReportsEmptyState;

