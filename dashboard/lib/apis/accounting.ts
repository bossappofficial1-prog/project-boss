import { apiClient } from "./base";

export type AccountType =
  | "ASSET"
  | "LIABILITY"
  | "EQUITY"
  | "REVENUE"
  | "EXPENSE";

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  isSystem: boolean;
  balance?: number; // Calculated dynamically in reports/balance sheets
}

export interface JournalItem {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  account?: Account;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference?: string | null;
  description: string;
  createdAt: string;
  items: JournalItem[];
}

export interface BalanceSheetReport {
  date: string;
  assets: Account[];
  liabilities: Account[];
  equity: Account[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

export interface ProfitLossReport {
  period: {
    startDate: string;
    endDate: string;
  };
  revenues: Account[];
  expenses: Account[];
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
}

export const accountingApi = {
  async getAccounts(): Promise<Account[]> {
    const res = await apiClient.get<{ data: Account[] }>(
      "/accounting/accounts",
    );
    return res.data.data;
  },

  async createAccount(data: {
    code: string;
    name: string;
    type: AccountType;
  }): Promise<Account> {
    const res = await apiClient.post<{ data: Account }>(
      "/accounting/accounts",
      data,
    );
    return res.data.data;
  },

  async updateAccount(id: string, name: string): Promise<Account> {
    const res = await apiClient.patch<{ data: Account }>(
      `/accounting/accounts/${id}`,
      { name },
    );
    return res.data.data;
  },

  async deleteAccount(id: string): Promise<null> {
    await apiClient.delete(`/accounting/accounts/${id}`);
    return null;
  },

  async getJournalEntries(params?: {
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: JournalEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.append("startDate", params.startDate);
    if (params?.endDate) searchParams.append("endDate", params.endDate);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const qs = searchParams.toString();
    const result = await apiClient.get(
      `/accounting/journal-entries${qs ? `?${qs}` : ""}`,
    );

    const { data, pagination } = result.data;

    return {
      data: data || [],
      total: pagination?.total || 0,
      page: pagination?.page || 1,
      limit: pagination?.limit || 10,
      totalPages: pagination?.totalPages || 1,
    };
  },

  async createJournalEntry(data: {
    date: string;
    reference?: string | null;
    description: string;
    items: Array<{
      accountId: string;
      debit: number;
      credit: number;
    }>;
  }): Promise<JournalEntry> {
    const res = await apiClient.post<{ data: JournalEntry }>(
      "/accounting/journal-entries",
      data,
    );
    return res.data.data;
  },

  async getBalanceSheet(date?: string): Promise<BalanceSheetReport> {
    const searchParams = new URLSearchParams();
    if (date) searchParams.append("date", date);
    const qs = searchParams.toString();
    const res = await apiClient.get<{ data: BalanceSheetReport }>(
      `/accounting/reports/balance-sheet${qs ? `?${qs}` : ""}`,
    );
    return res.data.data;
  },

  async getProfitLoss(
    startDate?: string,
    endDate?: string,
  ): Promise<ProfitLossReport> {
    const searchParams = new URLSearchParams();
    if (startDate) searchParams.append("startDate", startDate);
    if (endDate) searchParams.append("endDate", endDate);
    const qs = searchParams.toString();
    const res = await apiClient.get<{ data: ProfitLossReport }>(
      `/accounting/reports/profit-loss${qs ? `?${qs}` : ""}`,
    );
    return res.data.data;
  },

  async deleteJournalEntry(id: string): Promise<null> {
    await apiClient.delete(`/accounting/journal-entries/${id}`);
    return null;
  },
};

export default accountingApi;
