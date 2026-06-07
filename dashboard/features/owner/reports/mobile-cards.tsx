"use client";

import { type DailyReportRow } from '@/lib/apis/report';

interface ReportsMobileCardsProps {
	rows: DailyReportRow[];
}

const fmtCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export function ReportsMobileCards({ rows }: ReportsMobileCardsProps) {
	return (
		<div className="space-y-3">
			{rows.map((r) => (
				<div key={r.tanggal} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
					<div className="flex items-center justify-between">
						<div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{r.tanggal}</div>
						<div className="text-xs text-gray-500 dark:text-gray-400">{r.jumlahTransaksi} trx</div>
					</div>
					<div className="mt-2 grid grid-cols-2 gap-2 text-sm">
						<div>
							<div className="text-gray-500 dark:text-gray-400">Pendapatan</div>
							<div className="font-medium text-gray-900 dark:text-gray-100">{fmtCurrency(r.totalPendapatan)}</div>
						</div>
						<div>
							<div className="text-gray-500 dark:text-gray-400">Pengeluaran</div>
							<div className="font-medium text-gray-900 dark:text-gray-100">{fmtCurrency(r.totalPengeluaran)}</div>
						</div>
					</div>
					<div className="mt-2 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">{fmtCurrency(r.labaBersih)}</div>
				</div>
			))}
		</div>
	);
}

export default ReportsMobileCards;

