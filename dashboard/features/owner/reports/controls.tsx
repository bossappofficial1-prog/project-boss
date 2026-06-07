"use client";

import * as XLSX from 'xlsx';

interface ReportsControlsProps {
	startDate: string; // YYYY-MM-DD
	endDate: string;   // YYYY-MM-DD
	onRangeChange: (start: string, end: string) => void;
	onExport: () => void | Promise<void>;
}

export function ReportsControls({ startDate, endDate, onRangeChange, onExport }: ReportsControlsProps) {
	return (
		<div className="flex flex-col sm:flex-row gap-4">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
				<div>
					<label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Mulai</label>
					<input
						type="date"
						value={startDate}
						onChange={(e) => onRangeChange(e.target.value, endDate)}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
					/>
				</div>
				<div>
					<label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Selesai</label>
					<input
						type="date"
						value={endDate}
						onChange={(e) => onRangeChange(startDate, e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
					/>
				</div>
			</div>

			<div className="sm:w-60 flex items-end gap-3">
				<button
					onClick={onExport}
					className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
				>
					<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path d="M3 3a1 1 0 011-1h4a1 1 0 010 2H5v12h3a1 1 0 110 2H4a1 1 0 01-1-1V3zM13 5a1 1 0 10-2 0v3H8a1 1 0 100 2h3v3a1 1 0 102 0v-3h3a1 1 0 100-2h-3V5z" />
					</svg>
					Export Excel
				</button>
			</div>
		</div>
	);
}

export default ReportsControls;

