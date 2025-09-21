"use client";

interface ExpensesControlsProps {
	startISO: string;
	endISO: string;
	onRangeChange: (startISO: string, endISO: string) => void;
	onAdd: () => void;
}

function toYMD(iso: string) {
	try { return new Date(iso).toISOString().slice(0, 10); } catch { return ''; }
}

function mergeISO(dateYmd: string, time: 'start' | 'end') {
	const d = new Date(`${dateYmd}T${time === 'start' ? '00:00:00.000' : '23:59:59.999'}Z`);
	return d.toISOString();
}

export function ExpensesControls({ startISO, endISO, onRangeChange, onAdd }: ExpensesControlsProps) {
	const startYmd = toYMD(startISO);
	const endYmd = toYMD(endISO);

	return (
		<div className="flex flex-col sm:flex-row gap-4">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
				<div>
					<label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Mulai</label>
					<input
						type="date"
						value={startYmd}
						onChange={(e) => onRangeChange(mergeISO(e.target.value, 'start'), endISO)}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
					/>
				</div>
				<div>
					<label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Selesai</label>
					<input
						type="date"
						value={endYmd}
						onChange={(e) => onRangeChange(startISO, mergeISO(e.target.value, 'end'))}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
					/>
				</div>
			</div>

			<div className="sm:w-60 flex items-end">
				<button
					onClick={onAdd}
					className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto"
				>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
					</svg>
					Tambah Pengeluaran
				</button>
			</div>
		</div>
	);
}

export default ExpensesControls;

