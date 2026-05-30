import { db } from "../config/prisma";
import { AccountType } from "@prisma/client";

export class AccountingRepository {
  static async findAccountsByBusiness(businessId: string) {
    return db.account.findMany({
      where: { businessId },
      orderBy: { code: "asc" },
    });
  }

  static async findAccountById(id: string) {
    return db.account.findUnique({
      where: { id },
    });
  }

  static async findAccountByCode(businessId: string, code: string) {
    return db.account.findUnique({
      where: {
        businessId_code: {
          businessId,
          code,
        },
      },
    });
  }

  static async createAccount(data: {
    businessId: string;
    code: string;
    name: string;
    type: AccountType;
    isSystem?: boolean;
  }) {
    return db.account.create({
      data,
    });
  }

  static async updateAccount(id: string, data: { name: string }) {
    return db.account.update({
      where: { id },
      data,
    });
  }

  static async deleteAccount(id: string) {
    return db.account.delete({
      where: { id },
    });
  }

  static async isAccountUsed(accountId: string): Promise<boolean> {
    const count = await db.journalItem.count({
      where: { accountId },
    });
    return count > 0;
  }

  static async createDefaultAccounts(businessId: string) {
    const defaults = [
      // ASSETS
      { code: "1001", name: "Kas POS", type: AccountType.ASSET, isSystem: true },
      { code: "1002", name: "Kas Bank", type: AccountType.ASSET, isSystem: true },
      { code: "1101", name: "Piutang Dagang", type: AccountType.ASSET, isSystem: false },
      { code: "1201", name: "Persediaan Barang", type: AccountType.ASSET, isSystem: true },
      { code: "1301", name: "Peralatan & Mesin", type: AccountType.ASSET, isSystem: false },
      { code: "1302", name: "Akumulasi Penyusutan Peralatan", type: AccountType.ASSET, isSystem: false },
      
      // LIABILITIES
      { code: "2001", name: "Utang Dagang / Supplier", type: AccountType.LIABILITY, isSystem: true },
      { code: "2101", name: "Utang Bank / Modal Kerja", type: AccountType.LIABILITY, isSystem: false },
      
      // EQUITY
      { code: "3001", name: "Modal Owner", type: AccountType.EQUITY, isSystem: false },
      { code: "3002", name: "Prive Owner", type: AccountType.EQUITY, isSystem: false },
      { code: "3999", name: "Laba Ditahan", type: AccountType.EQUITY, isSystem: true },
      
      // REVENUE
      { code: "4001", name: "Pendapatan Penjualan POS", type: AccountType.REVENUE, isSystem: true },
      { code: "4002", name: "Pendapatan Lain-lain", type: AccountType.REVENUE, isSystem: false },
      
      // EXPENSES
      { code: "5001", name: "Harga Pokok Penjualan (HPP)", type: AccountType.EXPENSE, isSystem: true },
      { code: "6001", name: "Beban Gaji & Upah", type: AccountType.EXPENSE, isSystem: false },
      { code: "6002", name: "Beban Sewa Tempat", type: AccountType.EXPENSE, isSystem: false },
      { code: "6003", name: "Beban Listrik, Air & Internet", type: AccountType.EXPENSE, isSystem: false },
      { code: "6004", name: "Beban Pemasaran & Promosi", type: AccountType.EXPENSE, isSystem: false },
      { code: "6005", name: "Beban Operasional Lainnya", type: AccountType.EXPENSE, isSystem: true },
      { code: "6999", name: "Beban Penyusutan", type: AccountType.EXPENSE, isSystem: false },
    ];

    return db.$transaction(
      defaults.map((acc) =>
        db.account.upsert({
          where: {
            businessId_code: {
              businessId,
              code: acc.code,
            },
          },
          update: {},
          create: {
            businessId,
            code: acc.code,
            name: acc.name,
            type: acc.type,
            isSystem: acc.isSystem,
          },
        })
      )
    );
  }

  static async createJournalEntry(
    businessId: string,
    data: {
      date: Date;
      reference?: string;
      description: string;
      items: Array<{
        accountId: string;
        debit: number;
        credit: number;
      }>;
    }
  ) {
    return db.journalEntry.create({
      data: {
        businessId,
        date: data.date,
        reference: data.reference,
        description: data.description,
        items: {
          create: data.items.map((item) => ({
            accountId: item.accountId,
            debit: item.debit,
            credit: item.credit,
          })),
        },
      },
      include: {
        items: {
          include: {
            account: true,
          },
        },
      },
    });
  }

  static async findJournalEntries(businessId: string, query: {
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { startDate, endDate, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      businessId,
      ...(startDate || endDate ? {
        date: {
          ...(startDate ? { gte: startDate } : {}),
          ...(endDate ? { lte: endDate } : {}),
        }
      } : {}),
      ...(search ? {
        OR: [
          { description: { contains: search, mode: "insensitive" } },
          { reference: { contains: search, mode: "insensitive" } },
        ]
      } : {}),
    };

    const [data, total] = await db.$transaction([
      db.journalEntry.findMany({
        where,
        include: {
          items: {
            include: {
              account: true,
            },
          },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      db.journalEntry.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getAccountBalances(businessId: string, dateLimit?: Date) {
    // Aggregates total debits and credits per account for a business
    const items = await db.journalItem.groupBy({
      by: ["accountId"],
      where: {
        journalEntry: {
          businessId,
          ...(dateLimit ? { date: { lte: dateLimit } } : {}),
        },
      },
      _sum: {
        debit: true,
        credit: true,
      },
    });

    return items.map((item) => ({
      accountId: item.accountId,
      debit: item._sum.debit ?? 0,
      credit: item._sum.credit ?? 0,
    }));
  }

  static async getAccountBalancesInRange(
    businessId: string,
    startDate: Date,
    endDate: Date
  ) {
    const items = await db.journalItem.groupBy({
      by: ["accountId"],
      where: {
        journalEntry: {
          businessId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      _sum: {
        debit: true,
        credit: true,
      },
    });

    return items.map((item) => ({
      accountId: item.accountId,
      debit: item._sum.debit ?? 0,
      credit: item._sum.credit ?? 0,
    }));
  }

  static async findJournalEntryById(id: string) {
    return db.journalEntry.findUnique({
      where: { id },
    });
  }

  static async deleteJournalEntry(id: string, businessId: string) {
    return db.journalEntry.delete({
      where: { id, businessId },
    });
  }
}
