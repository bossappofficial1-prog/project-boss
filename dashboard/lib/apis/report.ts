import { apiCall } from './base';
import { apiClient } from './base';

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
		params: { type: string; date?: string; viewMode?: string }
	): Promise<Blob> {
		const response = await apiClient.get(`/reports/export/outlet/${outletId}`, {
			params,
			responseType: 'blob',
		});
		return response.data;
	},

	async exportStaffExcel(
		outletId: string,
		params: { type: string; date?: string }
	): Promise<Blob> {
		const response = await apiClient.get(`/reports/export/staff/${outletId}`, {
			params,
			responseType: 'blob',
		});
		return response.data;
	},
};

export default reportApi;

