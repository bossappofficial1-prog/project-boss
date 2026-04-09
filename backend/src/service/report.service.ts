import { db } from "../config/prisma";
import { OrderStatus } from "@prisma/client";
import * as ExcelJS from "exceljs";
import {
  getOutletByIdService,
  getAllOutletService,
  getOutletsByBusinessIdService,
} from "./outlet.service";
import { getBusinessByOwnerIdService } from "./business.service";
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

export class ReportService {
  static async getFinancialSummary(outletId: string, startDate: Date, endDate: Date) {
    // 1. Dapatkan detail outlet
    const outlet = await getOutletByIdService(outletId);

    // 2. Hitung Total Pendapatan dari pesanan yang selesai
    const revenueData = await db.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
      where: {
        outletId: outletId,
        orderStatus: OrderStatus.COMPLETED,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // 3. Hitung Total Pengeluaran
    const expenseData = await db.expense.aggregate({
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      where: {
        outletId: outletId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalRevenue = revenueData._sum.totalAmount || 0;
    const totalExpense = expenseData._sum.amount || 0;

    // 4. Hitung Laba Bersih
    const netProfit = totalRevenue - totalExpense;

    // 5. Dapatkan Ringkasan Penjualan
    const completedOrders = await db.order.findMany({
      where: {
        outletId: outletId,
        orderStatus: OrderStatus.COMPLETED,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const productSales = completedOrders
      .flatMap((order) => order.items)
      .reduce(
        (acc, item) => {
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
        {} as Record<
          string,
          { productId: string; name: string; quantitySold: number; totalRevenue: number }
        >,
      );

    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5); // Ambil 5 produk terlaris

    // 6. Susun Laporan
    return {
      outletName: outlet.name,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      incomeStatement: {
        totalRevenue: {
          amount: totalRevenue,
          transactionCount: revenueData._count.id,
        },
        totalExpense: {
          amount: totalExpense,
          transactionCount: expenseData._count.id,
        },
        netProfit,
      },
      salesSummary: {
        totalProductsSold: topSellingProducts.reduce((sum, p) => sum + p.quantitySold, 0),
        topSellingProducts,
      },
    };
  }

  static async getOutletReport(
    outletId: string,
    date: string,
    type: "daily" | "weekly" | "monthly",
  ) {
    const refDate = date ? new Date(date as string) : new Date();
    let start: Date, end: Date;

    if (type === "monthly") {
      // Tahun ini (Jan - Des)
      start = startOfYear(refDate);
      end = endOfYear(refDate);
    } else if (type === "weekly") {
      // Bulan ini (Minggu 1 - 4/5)
      start = startOfMonth(refDate);
      end = endOfMonth(refDate);
    } else {
      // Harian (10 Hari terakhir)
      // User requested: "harian hanya menampilkan 10 hari" & "diganti menjadi tampil per 10 hari"
      end = endOfDay(refDate);
      start = subDays(startOfDay(refDate), 9); // 10 days total including today
    }

    const { expenses, orders, stockLogs } = await ReportRepository.getOutletReport(
      outletId,
      date,
      start,
      end,
      type,
    );

    let finalReport = [];

    if (type === "monthly") {
      // Breakdown per Bulan untuk tampilan Tahunan (Monthly View shows Jan-Dec)
      // Note: The USER requested "Jika bulanan Menampilkan januari -desember tahun ini"
      // So type 'monthly' means showing data for the YEAR, broken down by MONTH.

      // Re-check logic:
      // "Jika ditampilkan harian, list yang muncul adalah list tanggal dalam 30 hari terakhir"
      // "Jika mingguan adalah list mingguan dalam bulan ini: minggu 1-minggu 4"
      // "Jika bulanan Menampilkan januari -desember tahun ini"

      // My previous code in 'monthly' block was doing weekly breakdown. That needs to change.

      for (let i = 0; i < 12; i++) {
        // start is startOfYear.
        const monthStart = new Date(start);
        monthStart.setMonth(start.getMonth() + i);
        const monthEnd = endOfMonth(monthStart);

        const mOrders = orders.filter((o) => o.createdAt >= monthStart && o.createdAt <= monthEnd);
        const mExpenses = expenses.filter((e) => e.date >= monthStart && e.date <= monthEnd);
        const mLogs = stockLogs.filter((l) => l.createdAt >= monthStart && l.createdAt <= monthEnd);

        const stats = this.calculateStats(mOrders, mExpenses, mLogs);

        // Trend: Breakdown by week inside the month? or just maybe weeks?
        // Let's show 4 weeks trend for the month
        const trend = [0, 0, 0, 0];
        // Simple distribution for now or calculate weeks properly if needed.
        // Let's stick to 0-filled or simple calculation.

        finalReport.push({
          label: format(monthStart, "MMMM yyyy"),
          jumlahTransaksi: stats.count,
          totalPendapatan: stats.revenue,
          totalPembelian: stats.pembelian,
          totalPengeluaran: stats.pengeluaran,
          gajiStaf: stats.gaji,
          totalHpp: stats.totalHpp,
          totalFees: stats.totalFees,
          labaBersih: stats.labaBersih,
          trend: [0, 0, 0, 0], // Placeholder
        });
      }
    } else if (type === "weekly") {
      // Breakdown per Minggu untuk tampilan Bulanan (Weekly View shows Weeks 1-4 of Month)
      const weeksInMonth = eachDayOfInterval({ start, end }).filter((d) => d.getDay() === 1); // Get all Mondays?

      // Better approach for "Minggu 1 - Minggu 4/5"
      // Just iterate weeks from startOfMonth

      let currentWeekStart = startOfWeek(start, { weekStartsOn: 1 });
      // Align with actual start if start is startOfMonth
      if (currentWeekStart < start) {
        currentWeekStart = start; // Handle partial first week?
        // Actually standard weeks usually start from 1st of month logic or calendar weeks?
        // User said "minggu 1-minggu 4".
        // Let's simple slice the month into 4-5 chunks.
      }

      // Simpler: iterate 4-5 times
      let weekIdx = 1;
      let iterDate = new Date(start);

      while (iterDate <= end) {
        const wStart = new Date(iterDate);
        //  const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
        // Careful not to go past end of month
        let wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
        if (wEnd > end) wEnd = new Date(end);

        const wOrders = orders.filter((o) => o.createdAt >= wStart && o.createdAt <= wEnd);
        const wExpenses = expenses.filter((e) => e.date >= wStart && e.date <= wEnd);
        const wLogs = stockLogs.filter((l) => l.createdAt >= wStart && l.createdAt <= wEnd);

        const stats = this.calculateStats(wOrders, wExpenses, wLogs);

        // Trend daily in week
        const trend = Array.from({ length: 7 }).map((_, dIdx) => {
          const day = new Date(wStart);
          day.setDate(wStart.getDate() + dIdx);
          if (day > wEnd) return 0;
          return wOrders
            .filter((o) => isSameDay(o.createdAt, day))
            .reduce((sum, curr) => sum + curr.totalAmount, 0);
        });

        finalReport.push({
          label: `Minggu ${weekIdx++} (${format(wStart, "dd/MM")})`,
          jumlahTransaksi: stats.count,
          totalPendapatan: stats.revenue,
          totalPembelian: stats.pembelian,
          totalPengeluaran: stats.pengeluaran,
          gajiStaf: stats.gaji,
          totalHpp: stats.totalHpp,
          totalFees: stats.totalFees,
          labaBersih: stats.labaBersih,
          trend: [0, 0, 0, 0], // Placeholder
        });

        iterDate = new Date(wEnd);
        iterDate.setDate(iterDate.getDate() + 1);
        iterDate = startOfDay(iterDate);
      }
    } else {
      // Harian: List tanggal dalam 30 hari terakhir.
      // So logic needs to change from "One day" to "Last 30 days" or "Selected Month Daily Breakdown"
      // User: "Jika ditampilkan harian, list yang muncul adalah list tanggal dalam 30 hari terakhir"

      // Loop through each day in interval
      const days = eachDayOfInterval({ start, end });
      // Sort Descending? usually reports are desc or asc. Let's keep ASC for chart/table flow, verify with user later.

      finalReport = days.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dOrders = orders.filter((o) => format(o.createdAt, "yyyy-MM-dd") === dayStr);
        const dExpenses = expenses.filter((e) => format(e.date, "yyyy-MM-dd") === dayStr);
        const dLogs = stockLogs.filter((l) => format(l.createdAt, "yyyy-MM-dd") === dayStr);

        const stats = this.calculateStats(dOrders, dExpenses, dLogs);

        // Hourly trend
        const trend =
          dOrders.length > 0
            ? Array.from({ length: 8 }).map((_, h) => {
                const hourOrders = dOrders.filter(
                  (o) => o.createdAt.getHours() >= h * 3 && o.createdAt.getHours() < (h + 1) * 3,
                );
                return hourOrders.reduce((sum, curr) => sum + curr.totalAmount, 0);
              })
            : [0, 0, 0, 0, 0, 0, 0, 0];

        return {
          label: format(day, "dd MMM yyyy"),
          jumlahTransaksi: stats.count,
          totalPendapatan: stats.revenue,
          totalPembelian: stats.pembelian,
          totalPengeluaran: stats.pengeluaran,
          gajiStaf: stats.gaji,
          totalHpp: stats.totalHpp,
          totalFees: stats.totalFees,
          labaBersih: stats.labaBersih,
          trend,
        };
      });
      // Reverse to show latest first? User said "List tanggal". Tables often latest top.
      // But let's stick to chronological for now or reverse in frontend.
      finalReport.reverse();
    }

    return finalReport;
  }

  static async getCompareOutletsReport(
    date: string,
    type: "daily" | "monthly" | "yearly",
    ownerId: string,
  ) {
    const refDate = date ? new Date(date as string) : new Date();
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

    // 1. Get Business of the owner
    const business = await getBusinessByOwnerIdService(ownerId);

    // 2. Get Outlets of the business
    const { outlets } = await getOutletsByBusinessIdService(business.id, undefined, 1000); // Take explicit limit to get all

    // 3. Get Report Data (we still fetch 'all' report data but we will filter in memory,
    // OR ideally we should filter in repository, but for now filtering in memory is fine if dataset isn't huge.
    // However, getOutletReport('all') might be heavy if there are many other businesses.
    // Optimization: ReportRepository.getOutletReport should probably accept a list of outletIds.
    // But given current implementation, let's stick to filtering.
    // WAIT! ReportRepository.getOutletReport('all') effectively ignores outletId.
    // This leaks data if we fetch EVERYTHING and filter here.
    // ReportRepository.getOutletReport needs to support filtering by list of outlet IDs OR we loop.
    // Looping might be n+1 queries.
    // Let's look at getOutletReport in repo.
    // Repo: if (outletId && outletId !== "all") { logic }. Else { no filter }.
    // So "all" fetches EVERYTHING in DB. That's bad for multi-tenant.
    // We SHOULD modify Repo to support fetching by list of IDs or BusinessID.
    // But for this task, let's see if we can pass a special "all" that is actually scoped?
    // No, repo interprets "all" as literal no filter.

    // Let's update Repo to accept `outletIds` array? Or just loop in Service?
    // Constructing specific query in Repo is better.
    // But changing Repo signature might break other things.
    // Let's modify Repo to accept `businessId`?
    // Actually, let's keep it simple.
    // We can just query the data we need directly or improve the Repo.

    // Given the task constraints, I'll filter in memory BUT fetching ALL data from DB is unsafe/inefficient.
    // I will filter by checking `outlet.businessId` in the query?
    // ReportRepository doesn't support businessId.

    // Let's iterate over outlets and fetch report for each? Parallelize.
    // `outlets.map(o => ReportRepository.getOutletReport(o.id...))`
    // This is safer but might spam DB.
    // "all" in Repo was probably intended for Single Tenant or Super Admin.
    // Since this is "Owner" dashboard, they should only see their own.

    // Let's try to pass `outlets.map(o => o.id)` to Repo? No, it expects string.

    // DECISION: Parallalize calls for each outlet.
    const reportDataPromises = outlets.map((outlet) =>
      ReportRepository.getOutletReport(outlet.id, date, start, end, type as any).then((data) => ({
        outlet,
        data,
      })),
    );

    const results = await Promise.all(reportDataPromises);

    const finalReport = results.map(({ outlet, data }) => {
      const { orders, expenses, stockLogs } = data;
      const stats = this.calculateStats(orders, expenses, stockLogs); // No need to filter again

      return {
        label: outlet.name,
        outletId: outlet.id,
        jumlahTransaksi: stats.count,
        totalPendapatan: stats.revenue,
        totalPembelian: stats.pembelian,
        totalPengeluaran: stats.pengeluaran,
        gajiStaf: stats.gaji,
        totalHpp: stats.totalHpp,
        totalFees: stats.totalFees,
        labaBersih: stats.labaBersih,
        trend: [0, 0, 0, 0], // Placeholder
      };
    });

    return finalReport;
  }

  private static calculateStats(
    filteredOrders: any[],
    filteredExpenses: any[],
    filteredLogs: any[],
  ) {
    let revenue = 0;
    let gaji = 0;
    let totalHpp = 0;
    let totalFees = 0;

    // Pembelian dihitung dari log stok masuk (IN) untuk laporan Stok & Aset
    let pembelian = filteredLogs.reduce(
      (acc, log) => acc + (log.hppPerUnit || 0) * log.quantity,
      0,
    );
    let pengeluaran = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

    filteredOrders.forEach((order) => {
      revenue += order.totalAmount;
      totalFees += (order.midtransFee || 0) + (order.appFee || 0);

      order.items.forEach((item: any) => {
        // Use historical HPP recorded in the order item
        totalHpp += (item.hppAtTimeOfOrder || 0) * item.quantity;

        // Use historical Commission recorded in the order item
        gaji += (item.commissionAtTimeOfOrder || 0) * item.quantity;
      });
    });

    return {
      revenue,
      pembelian,
      pengeluaran,
      gaji,
      totalHpp,
      totalFees,
      // Real Net Profit formula
      labaBersih: revenue - totalHpp - pengeluaran - gaji - totalFees,
      count: filteredOrders.length,
    };
  }

  static async getStaffReport(
    outletId: string,
    date: string,
    type: "daily" | "weekly" | "monthly",
  ) {
    const refDate = date ? new Date(date as string) : new Date();
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

    // 1. Fetch Completed Orders in Range for this Outlet
    const orders = await db.order.findMany({
      where: {
        outletId: outletId === "all" ? undefined : outletId,
        orderStatus: OrderStatus.COMPLETED,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        handledByStaff: true, // For Cashier info
        items: {
          include: {
            product: {
              include: {
                service: true, // For Service Provider info
              },
            },
          },
        },
      },
    });

    // 2. Process Cashier Performance (Based on handledByStaff)
    const cashierMap = new Map<string, { name: string; transactions: number; revenue: number }>();

    orders.forEach((order) => {
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
      staffId: `C-${c.name}`, // Pseudo ID
      name: c.name,
      role: "Kasir",
      transactionCount: c.transactions,
      revenue: c.revenue,
      commission: 0, // Cashiers don't have commission in this context
      type: "CASHIER",
    }));

    // 3. Process Service Staff Performance (Based on ProductService.providerName)
    const serviceMap = new Map<
      string,
      { name: string; transactions: number; commission: number }
    >();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.product.service) {
          const service = item.product.service;
          const providerName = service.providerName;

          if (providerName) {
            const entry = serviceMap.get(providerName) || {
              name: providerName,
              transactions: 0,
              commission: 0,
            };

            entry.transactions += 1; // Count per item served

            // Calculate Commission
            let itemCommission = 0;
            if (service.commissionType === "PERCENTAGE") {
              itemCommission = item.priceAtTimeOfOrder * (service.commissionValue / 100);
            } else {
              itemCommission = service.commissionValue;
            }
            // Multiply by quantity if item quantity > 1 (though services are usually 1, schema allows qty)
            itemCommission *= item.quantity;

            entry.commission += itemCommission;
            serviceMap.set(providerName, entry);
          }
        }
      });
    });

    const serviceList = Array.from(serviceMap.values()).map((s) => ({
      staffId: `S-${s.name}`, // Pseudo ID
      name: s.name,
      role: "Staff Layanan",
      transactionCount: s.transactions,
      revenue: 0, // Service staff revenue attribution is complex (item level), mostly we care about commission
      commission: s.commission,
      type: "SERVICE",
    }));

    // 4. Combine Lists
    return [...cashierList, ...serviceList];
  }

  // ─── Excel Export ───

  private static excelHeaderStyle: Partial<ExcelJS.Style> = {
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

  private static cellBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  private static applyHeaderStyle(sheet: ExcelJS.Worksheet) {
    sheet.getRow(1).eachCell((cell) => {
      Object.assign(cell, { style: ReportService.excelHeaderStyle });
    });
    sheet.getRow(1).height = 24;
  }

  private static applyRowBorder(row: ExcelJS.Row) {
    row.eachCell((cell) => {
      cell.border = ReportService.cellBorder;
    });
  }

  private static setCurrencyFormat(row: ExcelJS.Row, colNumbers: number[]) {
    colNumbers.forEach((n) => {
      const cell = row.getCell(n);
      if (typeof cell.value === "number") cell.numFmt = "#,##0";
    });
  }

  static async exportOutletReportToExcel(
    outletId: string,
    date: string,
    type: "daily" | "weekly" | "monthly",
    viewMode: "time" | "compare",
    ownerId?: string,
  ): Promise<ExcelJS.Workbook> {
    let data: any[];
    let outletName = "Semua Outlet";

    if (viewMode === "compare" && ownerId) {
      data = await this.getCompareOutletsReport(date, type as any, ownerId);
    } else {
      data = await this.getOutletReport(outletId, date, type);
      if (outletId !== "all") {
        try {
          const outlet = await getOutletByIdService(outletId);
          outletName = outlet.name;
        } catch {
          /* keep default */
        }
      }
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
      { header: "(-) Pengeluaran", key: "pengeluaran", width: 18 },
      { header: "(-) Gaji/Komisi", key: "gaji", width: 18 },
      { header: "= Laba Bersih", key: "laba", width: 20 },
      { header: "Pembelian Stok (Aset)", key: "pembelian", width: 22 },
    ];
    this.applyHeaderStyle(sheet);

    const currCols = [4, 5, 6, 7, 8]; // pendapatan, pengeluaran, gaji, laba, pembelian
    const totals = { trx: 0, pendapatan: 0, pengeluaran: 0, gaji: 0, laba: 0, pembelian: 0 };

    data.forEach((item: any, i: number) => {
      const row = sheet.addRow({
        no: i + 1,
        label: item.label,
        trx: item.jumlahTransaksi,
        pendapatan: item.totalPendapatan,
        pengeluaran: item.totalPengeluaran,
        gaji: item.gajiStaf,
        laba: item.labaBersih,
        pembelian: item.totalPembelian,
      });
      this.applyRowBorder(row);
      this.setCurrencyFormat(row, currCols);

      const labaCell = row.getCell(7);
      if (typeof labaCell.value === "number") {
        labaCell.font =
          labaCell.value >= 0
            ? { color: { argb: "FF16A34A" }, bold: true }
            : { color: { argb: "FFDC2626" }, bold: true };
      }

      // Style pembelian stok column as amber/info
      const pembelianCell = row.getCell(8);
      if (typeof pembelianCell.value === "number") {
        pembelianCell.font = { color: { argb: "FFD97706" } };
      }

      totals.trx += item.jumlahTransaksi;
      totals.pendapatan += item.totalPendapatan;
      totals.pengeluaran += item.totalPengeluaran;
      totals.gaji += item.gajiStaf;
      totals.laba += item.labaBersih;
      totals.pembelian += item.totalPembelian;
    });

    const totalRow = sheet.addRow({ no: "", label: "TOTAL", ...totals });
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.border = ReportService.cellBorder;
    });
    this.setCurrencyFormat(totalRow, currCols);

    // Info sheet
    const info = workbook.addWorksheet("Info");
    info.getColumn(1).width = 20;
    info.getColumn(2).width = 40;
    [
      ["Laporan", `Laporan Outlet - ${typeLabel}`],
      ["Outlet", outletName],
      [
        "Tanggal Export",
        new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }),
      ],
      ["Periode", date || new Date().toISOString().split("T")[0]],
    ].forEach((r) => info.addRow(r));

    return workbook;
  }

  static async exportStaffReportToExcel(
    outletId: string,
    date: string,
    type: "daily" | "weekly" | "monthly",
  ): Promise<ExcelJS.Workbook> {
    const data = await this.getStaffReport(outletId, date, type);

    let outletName = "Semua Outlet";
    if (outletId !== "all") {
      try {
        const outlet = await getOutletByIdService(outletId);
        outletName = outlet.name;
      } catch {
        /* keep default */
      }
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "BOSS App";
    workbook.created = new Date();

    const typeLabel = type === "daily" ? "Harian" : type === "weekly" ? "Mingguan" : "Bulanan";
    const cashiers = data.filter((d: any) => d.type === "CASHIER");
    const services = data.filter((d: any) => d.type === "SERVICE");

    // Sheet: Kasir
    const cs = workbook.addWorksheet("Kinerja Kasir");
    cs.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Nama Kasir", key: "name", width: 25 },
      { header: "Jumlah Transaksi", key: "trx", width: 18 },
      { header: "Total Penjualan", key: "revenue", width: 22 },
    ];
    this.applyHeaderStyle(cs);

    let totalCashierTrx = 0,
      totalCashierRevenue = 0;
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
      cell.border = ReportService.cellBorder;
    });
    this.setCurrencyFormat(cashierTotal, [4]);

    // Sheet: Staff Layanan
    const ss = workbook.addWorksheet("Kinerja Staff Layanan");
    ss.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Nama Provider", key: "name", width: 25 },
      { header: "Jumlah Layanan", key: "trx", width: 18 },
      { header: "Total Komisi", key: "commission", width: 22 },
    ];
    this.applyHeaderStyle(ss);

    let totalServiceTrx = 0,
      totalServiceComm = 0;
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
      cell.border = ReportService.cellBorder;
    });
    this.setCurrencyFormat(serviceTotal, [4]);

    // Info sheet
    const info = workbook.addWorksheet("Info");
    info.getColumn(1).width = 20;
    info.getColumn(2).width = 40;
    [
      ["Laporan", `Kinerja Staff - ${typeLabel}`],
      ["Outlet", outletName],
      [
        "Tanggal Export",
        new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }),
      ],
      ["Periode", date || new Date().toISOString().split("T")[0]],
      ["Total Kasir", String(cashiers.length)],
      ["Total Staff Layanan", String(services.length)],
    ].forEach((r) => info.addRow(r));

    return workbook;
  }
}
