"use client";

import { useSelectedOutletId } from '@/hooks/useOutlet';
import { useReports } from '@/hooks/useReports';
import { ReportsHeader } from '@/components/owner/reports/Header';
import { ReportsControls } from '@/components/owner/reports/Controls';
import { ReportsDesktopTable } from '@/components/owner/reports/DesktopTable';
import { ReportsMobileCards } from '@/components/owner/reports/MobileCards';
import { ReportsEmptyState } from '@/components/owner/reports/EmptyState';
import { ReportsSkeleton } from '@/components/owner/reports/Skeleton';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
	const { outletId } = useSelectedOutletId();
	const { rows, summary, loading, error, startDate, endDate, setRange, refetch, exportRows } = useReports(outletId);

	const handleExport = () => {
		const ws = XLSX.utils.json_to_sheet(exportRows);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Laporan Harian');
		XLSX.writeFile(wb, `laporan-harian-${startDate}_sd_${endDate}.xlsx`);
	};

	return (
		<>
			<div className="space-y-6">
				<ReportsHeader onRefresh={refetch} />

				<div className="bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/70 dark:border-gray-700/70 p-4 sm:p-6">
					<ReportsControls startDate={startDate} endDate={endDate} onRangeChange={setRange} onExport={handleExport} />
				</div>

				{loading ? (
					<ReportsSkeleton />
				) : error ? (
					<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">{error}</div>
				) : rows.length === 0 ? (
					<ReportsEmptyState />
				) : (
					<>
						<div className="hidden md:block">
							<ReportsDesktopTable rows={rows} summary={summary} />
						</div>
						<div className="md:hidden">
							<ReportsMobileCards rows={rows} />
						</div>
					</>
				)}
			</div>
		</>
	);
}

