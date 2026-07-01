import { apiCall } from './base';
import { apiClient } from './base';
import type { PeriodValue } from '@/components/ui/periode-picker';

function periodToParams(period: PeriodValue): Record<string, string | number> {
	switch (period.type) {
		case "daily":
			return { type: "daily", date: period.date };
		case "weekly":
			return {
				type: "weekly",
				date: period.startDate,
				startDate: period.startDate,
				endDate: period.endDate,
			};
		case "monthly":
			return {
				type: "monthly",
				date: `${period.year}-${String(period.month).padStart(2, "0")}-01`,
				month: period.month,
				year: period.year,
			};
		case "yearly":
			return {
				type: "yearly",
				date: `${period.year}-01-01`,
				year: period.year,
			};
	}
}

export interface DailyReportRow {
	tanggal: string; // YYYY-MM-DD
	jumlahTransaksi: number;
	totalPendapatan: number;
	totalPengeluaran: number;
	labaBersih: number;
}

export interface DailyReportSummary {
	totalTransaksi: number;
	totalPendapatan: number;
	totalPengeluaran: number;
	totalLabaBersih: number;
}

export interface FinancialSummary {
	outletName: string;
	period: { start: string; end: string };
	incomeStatement: {
		totalRevenue: { amount: number; transactionCount: number };
		totalExpense: { amount: number; transactionCount: number };
		netProfit: number;
	};
	salesSummary: {
		totalProductsSold: number;
		topSellingProducts: Array<{ productId: string; name: string; quantitySold: number; totalRevenue: number }>;
	};
}

export const reportApi = {
	// Daily report expects YYYY-MM-DD strings in query and returns daily + summary
	async getDaily(
		outletId: string,
		params?: { startDate?: string; endDate?: string }
	): Promise<{ daily: DailyReportRow[]; summary: DailyReportSummary }> {
		const searchParams = new URLSearchParams();
		if (params?.startDate) searchParams.append('startDate', params.startDate);
		if (params?.endDate) searchParams.append('endDate', params.endDate);
		const qs = searchParams.toString();
		return apiCall<{ daily: DailyReportRow[]; summary: DailyReportSummary }>(
			`/reports/daily/${outletId}${qs ? `?${qs}` : ''}`
		);
	},

	// Financial summary expects ISO datetime strings as query params
	async getFinancialSummary(
		outletId: string,
		startISO: string,
		endISO: string
	): Promise<FinancialSummary> {
		const searchParams = new URLSearchParams({
			outletId,
			startDate: startISO,
			endDate: endISO,
		});
		return apiCall<FinancialSummary>(`/reports/financial-summary?${searchParams.toString()}`);
	},

	async exportOutletExcel(
		outletId: string,
		period: PeriodValue,
		viewMode?: string,
	): Promise<Blob> {
		const params = { ...periodToParams(period), viewMode };
		const response = await apiClient.get(`/reports/export/outlet/${outletId}`, {
			params,
			responseType: 'blob',
		});
		return response.data;
	},

	async exportStaffExcel(
		outletId: string,
		period: PeriodValue,
	): Promise<Blob> {
		const params = periodToParams(period);
		const response = await apiClient.get(`/reports/export/staff/${outletId}`, {
			params,
			responseType: 'blob',
		});
		return response.data;
	},
};

export default reportApi;

