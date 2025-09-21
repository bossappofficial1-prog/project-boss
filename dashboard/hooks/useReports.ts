"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { reportApi, type DailyReportRow, type DailyReportSummary } from '@/lib/apis/report';

export interface UseReportsResult {
	rows: DailyReportRow[];
	summary: DailyReportSummary | null;
	loading: boolean;
	error: string | null;
	startDate: string; // YYYY-MM-DD
	endDate: string;   // YYYY-MM-DD
	setRange: (start: string, end: string) => void;
	refetch: () => Promise<void>;
	exportRows: Array<Record<string, string | number>>;
}

function formatYMD(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export function useReports(outletId?: string | null): UseReportsResult {
	const today = useMemo(() => new Date(), []);
	const sevenDaysAgo = useMemo(() => {
		const d = new Date();
		d.setDate(d.getDate() - 6); // inclusive of today (7 days window)
		return d;
	}, []);

	const [startDate, setStartDate] = useState<string>(formatYMD(sevenDaysAgo));
	const [endDate, setEndDate] = useState<string>(formatYMD(today));
	const [rows, setRows] = useState<DailyReportRow[]>([]);
	const [summary, setSummary] = useState<DailyReportSummary | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		if (!outletId) {
			setRows([]);
			setSummary(null);
			setError(null);
			setLoading(false);
			return;
		}
		try {
			setLoading(true);
			setError(null);
			const { daily, summary } = await reportApi.getDaily(outletId, { startDate, endDate });
			setRows(daily || []);
			setSummary(summary || null);
		} catch (err: any) {
			console.error('Error fetching reports:', err);
			setRows([]);
			setSummary(null);
			setError(err.message || 'Gagal memuat laporan');
		} finally {
			setLoading(false);
		}
	}, [outletId, startDate, endDate]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const setRange = useCallback((start: string, end: string) => {
		setStartDate(start);
		setEndDate(end);
	}, []);

	const exportRows = useMemo(() => {
		return rows.map(r => ({
			Tanggal: r.tanggal,
			'Jumlah Transaksi': r.jumlahTransaksi,
			'Total Pendapatan': r.totalPendapatan,
			'Total Pengeluaran': r.totalPengeluaran,
			'Laba Bersih': r.labaBersih,
		}));
	}, [rows]);

	return {
		rows,
		summary,
		loading,
		error,
		startDate,
		endDate,
		setRange,
		refetch: fetchData,
		exportRows,
	};
}

