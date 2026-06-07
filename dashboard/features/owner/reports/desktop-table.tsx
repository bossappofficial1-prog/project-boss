"use client";

import { type DailyReportRow, type DailyReportSummary } from '@/lib/apis/report';

interface ReportsDesktopTableProps {
	rows: DailyReportRow[];
	summary: DailyReportSummary | null;
}

const fmtCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

export function ReportsDesktopTable({ rows, summary }: ReportsDesktopTableProps) {
	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="bg-gray-50 dark:bg-gray-900">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tanggal</th>
							<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jumlah Transaksi</th>
							<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Pendapatan</th>
							<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Pengeluaran</th>
							<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Laba Bersih</th>
						</tr>
					</thead>
					<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
						{rows.map((r) => (
							<tr key={r.tanggal} className="hover:bg-gray-50 dark:hover:bg-gray-700">
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{r.tanggal}</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">{r.jumlahTransaksi}</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">{fmtCurrency(r.totalPendapatan)}</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">{fmtCurrency(r.totalPengeluaran)}</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-gray-100">{fmtCurrency(r.labaBersih)}</td>
							</tr>
						))}
					</tbody>
					{summary && (
						<tfoot>
							<tr className="bg-gray-50 dark:bg-gray-900">
								<td className="px-6 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Total</td>
								<td className="px-6 py-3 text-sm font-semibold text-right text-gray-900 dark:text-gray-100">{summary.totalTransaksi}</td>
								<td className="px-6 py-3 text-sm font-semibold text-right text-gray-900 dark:text-gray-100">{fmtCurrency(summary.totalPendapatan)}</td>
								<td className="px-6 py-3 text-sm font-semibold text-right text-gray-900 dark:text-gray-100">{fmtCurrency(summary.totalPengeluaran)}</td>
								<td className="px-6 py-3 text-sm font-semibold text-right text-gray-900 dark:text-gray-100">{fmtCurrency(summary.totalLabaBersih)}</td>
							</tr>
						</tfoot>
					)}
				</table>
			</div>
		</div>
	);
}

export default ReportsDesktopTable;

