import { BaseService } from "./base.service";
import { AccountingRepository } from "../repositories/accounting.repository";
import { CreateAccountInput, UpdateAccountInput, CreateJournalEntryInput } from "../schemas/accounting.schema";
import { AccountType } from "@prisma/client";

export class AccountingService extends BaseService {
  static async getAccounts(businessId: string) {
    let accounts = await AccountingRepository.findAccountsByBusiness(businessId);
    
    // Auto-initialize standard COA on first access
    if (accounts.length === 0) {
      await AccountingRepository.createDefaultAccounts(businessId);
      accounts = await AccountingRepository.findAccountsByBusiness(businessId);
    }
    
    return accounts;
  }

  static async createAccount(businessId: string, data: CreateAccountInput) {
    // Ensure accounts exist (triggers COA initialization if empty)
    await this.getAccounts(businessId);

    const existing = await AccountingRepository.findAccountByCode(businessId, data.code);
    if (existing) {
      this.conflict(`Kode akun "${data.code}" sudah terdaftar.`);
    }

    return AccountingRepository.createAccount({
      businessId,
      code: data.code,
      name: data.name,
      type: data.type,
      isSystem: false,
    });
  }

  static async updateAccount(id: string, businessId: string, data: UpdateAccountInput) {
    const account = await AccountingRepository.findAccountById(id);
    if (!account || account.businessId !== businessId) {
      this.notFound("Akun tidak ditemukan");
    }

    return AccountingRepository.updateAccount(id, { name: data.name });
  }

  static async deleteAccount(id: string, businessId: string) {
    const account = await AccountingRepository.findAccountById(id);
    if (!account || account.businessId !== businessId) {
      this.notFound("Akun tidak ditemukan");
    }

    if (account.isSystem) {
      this.forbidden("Akun sistem bawaan tidak boleh dihapus.");
    }

    const isUsed = await AccountingRepository.isAccountUsed(id);
    if (isUsed) {
      this.badRequest("Akun tidak dapat dihapus karena sudah digunakan dalam transaksi jurnal.");
    }

    return AccountingRepository.deleteAccount(id);
  }

  static async getJournalEntries(businessId: string, query: {
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: string;
    limit?: string;
  }) {
    // Auto-init COA
    await this.getAccounts(businessId);

    return AccountingRepository.findJournalEntries(businessId, {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      search: query.search,
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
    });
  }

  static async createJournalEntry(businessId: string, data: CreateJournalEntryInput) {
    // Ensure accounts exist (triggers COA initialization if empty)
    await this.getAccounts(businessId);

    return AccountingRepository.createJournalEntry(businessId, {
      ...data,
      reference: data.reference ?? undefined,
    });
  }

  static async getBalanceSheet(businessId: string, dateStr?: string) {
    const accounts = await this.getAccounts(businessId);
    const dateLimit = dateStr ? new Date(dateStr) : new Date();

    const balances = await AccountingRepository.getAccountBalances(businessId, dateLimit);
    const balancesMap = new Map(balances.map((b) => [b.accountId, b]));

    const resultAccounts = accounts.map((acc) => {
      const bal = balancesMap.get(acc.id) || { debit: 0, credit: 0 };
      
      // Calculate net balance depending on normal balance of account type
      let balance = 0;
      if (acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE) {
        balance = bal.debit - bal.credit;
      } else {
        balance = bal.credit - bal.debit;
      }

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        isSystem: acc.isSystem,
        balance,
      };
    });

    // 1. Separate Assets, Liabilities, Equity (excluding Retained Earnings for custom calculation)
    const assets = resultAccounts.filter((acc) => acc.type === AccountType.ASSET);
    const liabilities = resultAccounts.filter((acc) => acc.type === AccountType.LIABILITY);
    
    // We will separate standard equity accounts from Retained Earnings (3999) to compute it dynamically
    const standardEquity = resultAccounts.filter(
      (acc) => acc.type === AccountType.EQUITY && acc.code !== "3999"
    );

    // 2. Compute Net Profit up to Balance Sheet date dynamically to calculate Retained Earnings
    const revenueAccounts = resultAccounts.filter((acc) => acc.type === AccountType.REVENUE);
    const expenseAccounts = resultAccounts.filter((acc) => acc.type === AccountType.EXPENSE);

    const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalExpense = expenseAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    
    // Current period net profit
    const netProfit = totalRevenue - totalExpense;

    // Existing Retained Earnings account balance from previous closed transactions (if any)
    const reAccount = resultAccounts.find((acc) => acc.code === "3999");
    const existingRE = reAccount ? reAccount.balance : 0;
    
    // Total Retained Earnings = Existing + Current Net Profit
    const dynamicRetainedEarnings = existingRE + netProfit;

    const equity = [
      ...standardEquity,
      {
        id: reAccount?.id || "retained-earnings-id",
        code: "3999",
        name: "Laba Ditahan (Tahun Berjalan & Akumulasi)",
        type: AccountType.EQUITY,
        isSystem: true,
        balance: dynamicRetainedEarnings,
      },
    ];

    const totalAssets = assets.reduce((sum, acc) => sum + acc.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + acc.balance, 0);
    const totalEquity = equity.reduce((sum, acc) => sum + acc.balance, 0);

    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.1;

    return {
      date: dateLimit.toISOString(),
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced,
    };
  }

  static async getProfitLoss(businessId: string, startDateStr?: string, endDateStr?: string) {
    const accounts = await this.getAccounts(businessId);
    
    const now = new Date();
    const startDate = startDateStr ? new Date(startDateStr) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = endDateStr ? new Date(endDateStr) : now;

    const balances = await AccountingRepository.getAccountBalancesInRange(businessId, startDate, endDate);
    const balancesMap = new Map(balances.map((b) => [b.accountId, b]));

    const resultAccounts = accounts.map((acc) => {
      const bal = balancesMap.get(acc.id) || { debit: 0, credit: 0 };
      
      let balance = 0;
      if (acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE) {
        balance = bal.debit - bal.credit;
      } else {
        balance = bal.credit - bal.debit;
      }

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        isSystem: acc.isSystem,
        balance,
      };
    });

    const revenues = resultAccounts.filter((acc) => acc.type === AccountType.REVENUE && acc.balance !== 0);
    const expenses = resultAccounts.filter((acc) => acc.type === AccountType.EXPENSE && acc.balance !== 0);

    const totalRevenue = revenues.reduce((sum, acc) => sum + acc.balance, 0);
    const totalExpense = expenses.reduce((sum, acc) => sum + acc.balance, 0);
    const netProfit = totalRevenue - totalExpense;

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      revenues,
      expenses,
      totalRevenue,
      totalExpense,
      netProfit,
    };
  }

  static async deleteJournalEntry(id: string, businessId: string) {
    const entry = await AccountingRepository.findJournalEntryById(id);
    if (!entry || entry.businessId !== businessId) {
      this.notFound("Entri jurnal tidak ditemukan");
    }
    return AccountingRepository.deleteJournalEntry(id, businessId);
  }
}
