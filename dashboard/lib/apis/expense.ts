import { apiCall, API_BASE_URL, getAuthToken } from './base';

export interface Expense {
	id: string;
	description: string;
	amount: number;
	date: string; // ISO string
	outletId: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface CreateExpenseRequest {
	description: string;
	amount: number;
	date: string; // ISO datetime string
	outletId: string;
}

export interface UpdateExpenseRequest {
	description?: string;
	amount?: number;
	date?: string; // ISO datetime string
	outletId?: string;
}

export const expenseApi = {
	async create(data: CreateExpenseRequest): Promise<Expense> {
		return apiCall<Expense>('/expenses', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	async listByOutlet(
		outletId: string,
		params?: { startDate?: string; endDate?: string }
	): Promise<Expense[]> {
		const searchParams = new URLSearchParams();
		if (params?.startDate) searchParams.append('startDate', params.startDate);
		if (params?.endDate) searchParams.append('endDate', params.endDate);
		const qs = searchParams.toString();
		return apiCall<Expense[]>(`/expenses/outlet/${outletId}${qs ? `?${qs}` : ''}`);
	},

	async update(id: string, data: UpdateExpenseRequest): Promise<Expense> {
		return apiCall<Expense>(`/expenses/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	},

	async remove(id: string): Promise<null> {
			// Use manual fetch to gracefully handle 204 No Content responses
			const token = getAuthToken();
			const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
				method: 'DELETE',
				headers: {
					...(token ? { Authorization: `Bearer ${token}` } : {}),
					'ngrok-skip-browser-warning': 'true',
				},
			});
			if (!res.ok) {
				const text = await res.text();
				let msg: string | null = null;
				try { const j = text ? JSON.parse(text) : null; msg = j?.message || j?.error || null; } catch {}
				throw new Error(msg || `${res.status} ${res.statusText}`);
			}
			return null;
	},
};

export default expenseApi;

