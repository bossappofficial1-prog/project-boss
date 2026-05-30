import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import accountingApi, { Account, AccountType, JournalEntry, BalanceSheetReport, ProfitLossReport } from "@/lib/apis/accounting";

const ACCOUNTING_KEYS = {
  all: ["accounting"] as const,
  accounts: () => ["accounting", "accounts"] as const,
  journalEntries: (params: any) => ["accounting", "journal-entries", params] as const,
  balanceSheet: (date?: string) => ["accounting", "balance-sheet", date] as const,
  profitLoss: (startDate?: string, endDate?: string) => ["accounting", "profit-loss", startDate, endDate] as const,
};

export function useGetAccounts() {
  return useQuery({
    queryKey: ACCOUNTING_KEYS.accounts(),
    queryFn: () => accountingApi.getAccounts(),
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { code: string; name: string; type: AccountType }) =>
      accountingApi.createAccount(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTING_KEYS.accounts() });
      qc.invalidateQueries({ queryKey: ACCOUNTING_KEYS.balanceSheet() });
      qc.invalidateQueries({ queryKey: ACCOUNTING_KEYS.profitLoss() });
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; name: string }) =>
      accountingApi.updateAccount(payload.id, payload.name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTING_KEYS.accounts() });
      qc.invalidateQueries({ queryKey: ACCOUNTING_KEYS.balanceSheet() });
      qc.invalidateQueries({ queryKey: ACCOUNTING_KEYS.profitLoss() });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountingApi.deleteAccount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ACCOUNTING_KEYS.accounts() });
      qc.invalidateQueries({ queryKey: ACCOUNTING_KEYS.balanceSheet() });
      qc.invalidateQueries({ queryKey: ACCOUNTING_KEYS.profitLoss() });
    },
  });
}

export function useGetJournalEntries(params?: {
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ACCOUNTING_KEYS.journalEntries(params),
    queryFn: () => accountingApi.getJournalEntries(params),
  });
}

export function useCreateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      date: string;
      reference?: string | null;
      description: string;
      items: Array<{
        accountId: string;
        debit: number;
        credit: number;
      }>;
    }) => accountingApi.createJournalEntry(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounting"] });
    },
  });
}

export function useGetBalanceSheet(date?: string) {
  return useQuery({
    queryKey: ACCOUNTING_KEYS.balanceSheet(date),
    queryFn: () => accountingApi.getBalanceSheet(date),
  });
}

export function useGetProfitLoss(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ACCOUNTING_KEYS.profitLoss(startDate, endDate),
    queryFn: () => accountingApi.getProfitLoss(startDate, endDate),
  });
}

export function useDeleteJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountingApi.deleteJournalEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounting"] });
    },
  });
}
