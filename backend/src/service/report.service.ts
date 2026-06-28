import * as ExcelJS from "exceljs";
import { BaseService } from "./base.service";
import { ReportRepository } from "../repositories/report.repository";
import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  startOfYear,
  endOfYear,
} from "date-fns";
import { RedisUtils } from "../utils/redis.utils";

interface OutletReport {
  label: string;
  jumlahTransaksi: number;
  totalPendapatan: number;
  totalPajak: number;
  totalPembelian: any;
  totalPengeluaran: any;
  gajiStaf: number;
  totalHpp: number;
  totalFees: number;
  labaBersih: number;
  trend: number[];
}

interface StaffReport {
  staffId: string;
  name: string;
  role: string;
  transactionCount: number;
  revenue: number;
  commission: number;
  type: string;
}

export class ReportService extends BaseService {
  constructor(private reportRepository: ReportRepository) {
    super();
  }

  async getFinancialSummary(outletId: string, startDate: Date, endDate: Date) {
    const cachedkey = `report:summary:${outletId}:${startDate.toISOString()}:${endDate.toISOString()}`;

    const cached = await RedisUtils.get(cachedkey);
    if (cached) return cached;

    const start = startOfDay(startDate);
    const end = endOfDay(endDate);

    const revenueData = await this.reportRepository.getRevenueAggregate(outletId, start, end);
    const expenseData = await this.reportRepository.getExpenseAggregate(outletId, start, end);

    const totalRevenue = revenueData._sum.totalAmount || 0;
    const totalExpense = expenseData._sum.amount || 0;
    const netProfit = totalRevenue - totalExpense;

    const completedOrders = await this.reportRepository.getCompletedOrdersWithProducts(outletId, start, end);

    const productSales = completedOrders
      .flatMap((order: any) => order.items)
      .reduce(
        (acc: any, item: any) => {
          const existing = acc[item.productId];
          if (existing) {
            existing.quantitySold += item.quantity;
            existing.totalRevenue += item.priceAtTimeOfOrder * item.quantity;
          } else {
            acc[item.productId] = {
              productId: item.productId,
              name: item.product.name,
              quantitySold: item.quantity,
              totalRevenue: item.priceAtTimeOfOrder * item.quantity,
            };
          }
          return acc;
        },
        {} as Record<string, { productId: string; name: string; quantitySold: number; totalRevenue: number }>,
      );

    const topSellingProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    const data = {
      outletName: outletId,
      period: { start: start.toISOString(), end: end.toISOString() },
      incomeStatement: {
        totalRevenue: { amount: totalRevenue, transactionCount: revenueData._count.id },
        totalExpense: { amount: totalExpense, transactionCount: expenseData._count.id },
        netProfit,
      },
      salesSummary: {
        totalProductsSold: topSellingProducts.reduce((sum: number, p: any) => sum + p.quantitySold, 0),
        topSellingProducts,
      },
    };

    await RedisUtils.set(cachedkey, data, 15 * 60);
    return data;
  }

  private async resolveOutletIds(outletId: string, ownerId: string): Promise<string[]> {
    if (outletId === "all") {
      // For "all" outlets, we need to get business by owner
      // This is a simplified version - in production you'd call outlet service
      return [outletId];
    }
    return [outletId];
  }

  async getOutletReport(
    outletId: string,
    date: string,
    type: "daily" | "weekly" | "monthly",
    ownerId: string
  ): Promise<OutletReport[]> {
    const cachedkey = `report:outlet:${outletId}:${date}:${type}:${ownerId}`;
    const cached = await RedisUtils.get(cachedkey);
    if (cached) return cached as OutletReport[];

    const refDate = date ? new Date(date) : new Date();
    let start: Date, end: Date;

    if (type === "monthly") {
      start = startOfYear(refDate);
      end = endOfYear(refDate);
    } else if (type === "weekly") {
      start = startOfMonth(refDate);
      end = endOfMonth(refDate);
    } else {
      end = endOfDay(refDate);
      start = subDays(startOfDay(refDate), 9);
    }

    const targetOutletIds = await this.resolveOutletIds(outletId, ownerId);

    const { expenses, orders, stockLogs } = await this.reportRepository.getOutletReport(
      targetOutletIds,
      date,
      start,
      end,
      type,
    );

    let finalReport = [];

    if (type === "monthly") {
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(start);
        monthStart.setMonth(start.getMonth() + i);
        const monthEnd = endOfMonth(monthStart);

        const mOrders = orders.filter((o: any) => o.createdAt >= monthStart && o.createdAt <= monthEnd);
        const mExpenses = expenses.filter((e: any) => e.date >= monthStart && e.date <= monthEnd);
        const mLogs = stockLogs.filter((l: any) => l.createdAt >= monthStart && l.createdAt <= monthEnd);

        const stats = this.calculateStats(mOrders, mExpenses, mLogs);

        finalReport.push({
          label: format(monthStart, "MMMM yyyy"),
          jumlahTransaksi: stats.count,
          totalPendapatan: stats.revenue,
          totalPajak: stats.totalPajak,
          totalPembelian: stats.pembelian,
          totalPengeluaran: stats.pengeluaran,
          gajiStaf: stats.gaji,
          totalHpp: stats.totalHpp,
          totalFees: stats.totalFees,
          labaBersih: stats.labaBersih,
          trend: [0, 0, 0, 0],
        });
      }
    } else if (type === "weekly") {
      let weekIdx = 1;
      let iterDate = new Date(start);

      while (iterDate <= end) {
        const wStart = new Date(iterDate);
        let wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
        if (wEnd > end) wEnd = new Date(end);

        const wOrders = orders.filter((o: any) => o.createdAt >= wStart && o.createdAt <= wEnd);
        const wExpenses = expenses.filter((e: any) => e.date >= wStart && e.date <= wEnd);
        const wLogs = stockLogs.filter((l: any) => l.createdAt >= wStart && l.createdAt <= wEnd);

        const stats = this.calculateStats(wOrders, wExpenses, wLogs);

        const trend = Array.from({ length: 7 }).map((_, dIdx) => {
          const day = new Date(wStart);
          day.setDate(wStart.getDate() + dIdx);
          if (day > wEnd) return 0;
          return wOrders
            .filter((o: any) => isSameDay(o.createdAt, day))
            .reduce((sum: number, curr: any) => sum + curr.totalAmount, 0);
        });

        finalReport.push({
          label: `Minggu ${weekIdx++} (${format(wStart, "dd/MM")})`,
          jumlahTransaksi: stats.count,
          totalPendapatan: stats.revenue,
          totalPajak: stats.totalPajak,
          totalPembelian: stats.pembelian,
          totalPengeluaran: stats.pengeluaran,
          gajiStaf: stats.gaji,
          totalHpp: stats.totalHpp,
          totalFees: stats.totalFees,
          labaBersih: stats.labaBersih,
          trend: [0, 0, 0, 0],
        });

        iterDate = new Date(wEnd);
        iterDate.setDate(iterDate.getDate() + 1);
        iterDate = startOfDay(iterDate);
      }
    } else {
      const days = eachDayOfInterval({ start, end });

      finalReport = days.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dOrders = orders.filter((o: any) => format(o.createdAt, "yyyy-MM-dd") === dayStr);
        const dExpenses = expenses.filter((e: any) => format(e.date, "yyyy-MM-dd") === dayStr);
        const dLogs = stockLogs.filter((l: any) => format(l.createdAt, "yyyy-MM-dd") === dayStr);

        const stats = this.calculateStats(dOrders, dExpenses, dLogs);

        const trend = dOrders.length > 0
          ? Array.from({ length: 8 }).map((_, h) => {
            const hourOrders = dOrders.filter(
              (o: any) => o.createdAt.getHours() >= h * 3 && o.createdAt.getHours() < (h + 1) * 3,
            );
            return hourOrders.reduce((sum: number, curr: any) => sum + curr.totalAmount, 0);
          })
          : [0, 0, 0, 0, 0, 0, 0, 0];

        return {
          label: format(day, "dd MMM yyyy"),
          jumlahTransaksi: stats.count,
          totalPendapatan: stats.revenue,
          totalPajak: stats.totalPajak,
          totalPembelian: stats.pembelian,
          totalPengeluaran: stats.pengeluaran,
          gajiStaf: stats.gaji,
          totalHpp: stats.totalHpp,
          totalFees: stats.totalFees,
          labaBersih: stats.labaBersih,
          trend,
        };
      });

      finalReport.reverse();
    }

    await RedisUtils.set(cachedkey, finalReport, 15 * 60);
    return finalReport;
  }

  async getCompareOutletsReport(
    date: string,
    type: "daily" | "monthly" | "yearly",
    businessId: string,
  ): Promise<OutletReport[]> {
    const cachedkey = `report:compare:${businessId}:${date}:${type}`;
    const cached = await RedisUtils.get(cachedkey);
    if (cached) return cached as OutletReport[];

    const refDate = date ? new Date(date) : new Date();
    let start: Date, end: Date;

    if (type === "yearly") {
      start = startOfYear(refDate);
      end = endOfYear(refDate);
    } else if (type === "monthly") {
      start = startOfMonth(refDate);
      end = endOfMonth(refDate);
    } else {
      start = startOfDay(refDate);
      end = endOfDay(refDate);
    }

    const outlets = await this.reportRepository.getOutletsByBusinessId(businessId);
    if (outlets.length === 0) {
      return [];
    }

    const reportDataPromises = outlets.map((outlet) =>
      this.reportRepository.getOutletReport([outlet.id], date, start, end, type as any).then((data) => ({
        outletId: outlet.id,
        outletName: outlet.name,
        data,
      })),
    );

    const results = await Promise.all(reportDataPromises);

    const finalReport = results.map(({ outletId, outletName, data }) => {
      const { orders, expenses, stockLogs } = data;
      const stats = this.calculateStats(orders, expenses, stockLogs);

      return {
        label: outletName,
        outletId,
        jumlahTransaksi: stats.count,
        totalPendapatan: stats.revenue,
        totalPajak: stats.totalPajak,
        totalPembelian: stats.pembelian,
        totalPengeluaran: stats.pengeluaran,
        gajiStaf: stats.gaji,
        totalHpp: stats.totalHpp,
        totalFees: stats.totalFees,
        labaBersih: stats.labaBersih,
        trend: [0, 0, 0, 0],
      };
    });

    await RedisUtils.set(cachedkey, finalReport, 15 * 60);
    return finalReport;
  }

  private calculateStats(
    filteredOrders: any[],
    filteredExpenses: any[],
    filteredLogs: any[],
  ) {
    let revenue = 0;
    let totalPajak = 0;
    let gaji = 0;
    let totalHpp = 0;
    let totalFees = 0;

    const pembelian = filteredLogs.reduce(
      (acc, log) => acc + (log.hppPerUnit || 0) * log.quantity,
      0,
    );
    const pengeluaran = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

    filteredOrders.forEach((order) => {
      revenue += order.totalAmount;
      totalPajak += order.taxAmount ?? 0;
      totalFees += (order.midtransFee || 0) + (order.appFee || 0);

      order.items.forEach((item: any) => {
        totalHpp += item.hppAtTimeOfOrder || 0;
        gaji += (item.commissionAtTimeOfOrder || 0) * item.quantity;
      });
    });

    return {
      revenue,
      totalPajak,
      pembelian,
      pengeluaran,
      gaji,
      totalHpp,
      totalFees,
      labaBersih: revenue - totalPajak - totalHpp - pengeluaran - gaji - totalFees,
      count: filteredOrders.length,
    };
  }

  async getStaffReport(
    outletId: string,
    date: string,
    type: "daily" | "weekly" | "monthly",
    ownerId: string
  ): Promise<StaffReport[]> {
    const cachedkey = `report:staff:${outletId}:${date}:${type}:${ownerId}`;
    const cached = await RedisUtils.get(cachedkey);
    if (cached) return cached as StaffReport[];

    const refDate = date ? new Date(date) : new Date();
    let start: Date, end: Date;

    if (type === "monthly") {
      start = startOfMonth(refDate);
      end = endOfMonth(refDate);
    } else if (type === "weekly") {
      start = startOfWeek(refDate, { weekStartsOn: 1 });
      end = endOfWeek(refDate, { weekStartsOn: 1 });
    } else {
      start = startOfDay(refDate);
      end = endOfDay(refDate);
    }

    const targetOutletIds = await this.resolveOutletIds(outletId, ownerId);

    const orders = await this.reportRepository.getOrdersForStaffReport(targetOutletIds, start, end);

    const cashierMap = new Map<string, { name: string; transactions: number; revenue: number }>();

    orders.forEach((order: any) => {
      const staffId = order.handledByStaff?.id || "owner";
      const staffName = order.handledByStaff?.name || "Owner (Pemilik)";

      const entry = cashierMap.get(staffId) || {
        name: staffName,
        transactions: 0,
        revenue: 0,
      };
      entry.transactions += 1;
      entry.revenue += order.totalAmount;
      cashierMap.set(staffId, entry);
    });

    const cashierList = Array.from(cashierMap.values()).map((c) => ({
      staffId: `C-${c.name}`,
      name: c.name,
      role: "Kasir",
      transactionCount: c.transactions,
      revenue: c.revenue,
      commission: 0,
      type: "CASHIER",
    }));

    const serviceMap = new Map<string, { name: string; transactions: number; commission: number }>();

    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        if (item.product.service) {
          const service = item.product.service;
          const providerName = service.providerName;

          if (providerName) {
            const entry = serviceMap.get(providerName) || {
              name: providerName,
              transactions: 0,
              commission: 0,
            };

            entry.transactions += 1;

            let itemCommission = 0;
            if (service.commissionType === "PERCENTAGE") {
              itemCommission = item.priceAtTimeOfOrder * (service.commissionValue / 100);
            } else {
              itemCommission = service.commissionValue;
            }

            itemCommission *= item.quantity;
            entry.commission += itemCommission;
            serviceMap.set(providerName, entry);
          }
        }
      });
    });

    const serviceList = Array.from(serviceMap.values()).map((s) => ({
      staffId: `S-${s.name}`,
      name: s.name,
      role: "Staff Layanan",
      transactionCount: s.transactions,
      revenue: 0,
      commission: s.commission,
      type: "SERVICE",
    }));

    const finalData = [...cashierList, ...serviceList];

    await RedisUtils.set(cachedkey, finalData, 15 * 60);
    return finalData;
  }

  private excelHeaderStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } },
    alignment: { vertical: "middle", horizontal: "center", wrapText: true },
    border: {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    },
  };

  private cellBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  private applyHeaderStyle(sheet: ExcelJS.Worksheet) {
    sheet.getRow(1).eachCell((cell) => {
      Object.assign(cell, { style: this.excelHeaderStyle });
    });
    sheet.getRow(1).height = 24;
  }

  private applyRowBorder(row: ExcelJS.Row) {
    row.eachCell((cell) => {
      cell.border = this.cellBorder;
    });
  }

  private setCurrencyFormat(row: ExcelJS.Row, colNumbers: number[]) {
    colNumbers.forEach((n) => {
      const cell = row.getCell(n);
      if (typeof cell.value === "number") cell.numFmt = "#,##0";
    });
  }

  async exportOutletReportToExcel(
    outletId: string,
    date: string,
    type: "daily" | "weekly" | "monthly",
    viewMode: "time" | "compare",
    ownerId: string,
  ): Promise<ExcelJS.Workbook> {
    let data: any[];
    let outletName = "Semua Outlet";

    if (viewMode === "compare" && ownerId) {
      data = await this.getCompareOutletsReport(date, type as any, ownerId);
    } else {
      data = await this.getOutletReport(outletId, date, type, ownerId);
      outletName = outletId === "all" ? "Semua Outlet" : outletId;
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "BOSS App";
    workbook.created = new Date();

    const typeLabel =
      viewMode === "compare"
        ? "Perbandingan Outlet"
        : type === "daily"
          ? "Harian"
          : type === "weekly"
            ? "Mingguan"
            : "Bulanan";

    const sheet = workbook.addWorksheet(`Laporan ${typeLabel}`);
    sheet.columns = [
      { header: "No", key: "no", width: 6 },
      { header: viewMode === "compare" ? "Outlet" : "Periode", key: "label", width: 28 },
      { header: "Jml Transaksi", key: "trx", width: 15 },
      { header: "(+) Pendapatan", key: "pendapatan", width: 20 },
      { header: "(+) PPN", key: "ppn", width: 18 },
      { header: "(-) Pengeluaran", key: "pengeluaran", width: 18 },
      { header: "(-) Gaji/Komisi", key: "gaji", width: 18 },
      { header: "= Laba Bersih", key: "laba", width: 20 },
      { header: "Pembelian Stok (Aset)", key: "pembelian", width: 22 },
    ];
    this.applyHeaderStyle(sheet);

    const currCols = [4, 5, 6, 7, 8, 9];
    const totals = { trx: 0, pendapatan: 0, ppn: 0, pengeluaran: 0, gaji: 0, laba: 0, pembelian: 0 };

    data.forEach((item: any, i: number) => {
      const row = sheet.addRow({
        no: i + 1,
        label: item.label,
        trx: item.jumlahTransaksi,
        pendapatan: item.totalPendapatan,
        ppn: item.totalPajak,
        pengeluaran: item.totalPengeluaran,
        gaji: item.gajiStaf,
        laba: item.labaBersih,
        pembelian: item.totalPembelian,
      });
      this.applyRowBorder(row);
      this.setCurrencyFormat(row, currCols);

      const labaCell = row.getCell(8);
      if (typeof labaCell.value === "number") {
        labaCell.font =
          labaCell.value >= 0
            ? { color: { argb: "FF16A34A" }, bold: true }
            : { color: { argb: "FFDC2626" }, bold: true };
      }

      totals.trx += item.jumlahTransaksi;
      totals.pendapatan += item.totalPendapatan;
      totals.ppn += item.totalPajak;
      totals.pengeluaran += item.totalPengeluaran;
      totals.gaji += item.gajiStaf;
      totals.laba += item.labaBersih;
      totals.pembelian += item.totalPembelian;
    });

    const totalRow = sheet.addRow({ no: "", label: "TOTAL", ...totals });
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.border = this.cellBorder;
    });
    this.setCurrencyFormat(totalRow, currCols);

    const info = workbook.addWorksheet("Info");
    info.getColumn(1).width = 20;
    info.getColumn(2).width = 40;
    [
      ["Laporan", `Laporan Outlet - ${typeLabel}`],
      ["Outlet", outletName],
      ["Tanggal Export", new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })],
      ["Periode", date || new Date().toISOString().split("T")[0]],
    ].forEach((r) => info.addRow(r));

    return workbook;
  }

  async exportStaffReportToExcel(
    outletId: string,
    date: string,
    type: "daily" | "weekly" | "monthly",
    ownerId: string
  ): Promise<ExcelJS.Workbook> {
    const data = await this.getStaffReport(outletId, date, type, ownerId);

    const outletName = outletId === "all" ? "Semua Outlet" : outletId;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "BOSS App";
    workbook.created = new Date();

    const typeLabel = type === "daily" ? "Harian" : type === "weekly" ? "Mingguan" : "Bulanan";
    const cashiers = data.filter((d: any) => d.type === "CASHIER");
    const services = data.filter((d: any) => d.type === "SERVICE");

    const cs = workbook.addWorksheet("Kinerja Kasir");
    cs.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Nama Kasir", key: "name", width: 25 },
      { header: "Jumlah Transaksi", key: "trx", width: 18 },
      { header: "Total Penjualan", key: "revenue", width: 22 },
    ];
    this.applyHeaderStyle(cs);

    let totalCashierTrx = 0, totalCashierRevenue = 0;
    cashiers.forEach((c: any, i: number) => {
      const row = cs.addRow({
        no: i + 1,
        name: c.name,
        trx: c.transactionCount,
        revenue: c.revenue,
      });
      this.applyRowBorder(row);
      this.setCurrencyFormat(row, [4]);
      totalCashierTrx += c.transactionCount;
      totalCashierRevenue += c.revenue;
    });

    const cashierTotal = cs.addRow({
      no: "",
      name: "TOTAL",
      trx: totalCashierTrx,
      revenue: totalCashierRevenue,
    });
    cashierTotal.eachCell((cell) => {
      cell.font = { bold: true };
      cell.border = this.cellBorder;
    });
    this.setCurrencyFormat(cashierTotal, [4]);

    const ss = workbook.addWorksheet("Kinerja Staff Layanan");
    ss.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Nama Provider", key: "name", width: 25 },
      { header: "Jumlah Layanan", key: "trx", width: 18 },
      { header: "Total Komisi", key: "commission", width: 22 },
    ];
    this.applyHeaderStyle(ss);

    let totalServiceTrx = 0, totalServiceComm = 0;
    services.forEach((s: any, i: number) => {
      const row = ss.addRow({
        no: i + 1,
        name: s.name,
        trx: s.transactionCount,
        commission: s.commission,
      });
      this.applyRowBorder(row);
      this.setCurrencyFormat(row, [4]);
      totalServiceTrx += s.transactionCount;
      totalServiceComm += s.commission;
    });

    const serviceTotal = ss.addRow({
      no: "",
      name: "TOTAL",
      trx: totalServiceTrx,
      commission: totalServiceComm,
    });
    serviceTotal.eachCell((cell) => {
      cell.font = { bold: true };
      cell.border = this.cellBorder;
    });
    this.setCurrencyFormat(serviceTotal, [4]);

    const info = workbook.addWorksheet("Info");
    info.getColumn(1).width = 20;
    info.getColumn(2).width = 40;
    [
      ["Laporan", `Kinerja Staff - ${typeLabel}`],
      ["Outlet", outletName],
      ["Tanggal Export", new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })],
      ["Periode", date || new Date().toISOString().split("T")[0]],
      ["Total Kasir", String(cashiers.length)],
      ["Total Staff Layanan", String(services.length)],
    ].forEach((r) => info.addRow(r));

    return workbook;
  }
}
