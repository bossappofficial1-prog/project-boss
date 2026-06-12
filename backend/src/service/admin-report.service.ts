import { BaseService } from './base.service';
import { AdminReportRepository, CreateAdminReportInput, AdminReportFilters } from '../repositories/admin-report.repository';
import { AuditLogService } from './audit-log.service';
import { PdfBaseService } from './pdf-base.service';
import { ReportType, ReportPeriod, ReportStatus, AuditAction, AuditEntityType } from '@prisma/client';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs-extra';

export class AdminReportService extends BaseService {
  constructor(
    private adminReportRepository: AdminReportRepository,
    private auditLogService: AuditLogService,
  ) {
    super();
  }

  async generateReport(
    type: ReportType,
    period: ReportPeriod,
    generatedBy: string,
    customDateRange?: { startDate: string; endDate: string },
  ) {
    const title = this.generateTitle(type, period);
    
    const report = await this.adminReportRepository.create({
      type,
      period,
      title,
      parameters: customDateRange,
      generatedBy,
    });

    this.processReport(report.id, type, period, customDateRange).catch(console.error);

    await this.auditLogService.logAdminAction(
      generatedBy,
      AuditAction.REPORT_GENERATED,
      AuditEntityType.REPORT,
      report.id,
      title,
      { type, period },
    );

    return report;
  }

  private async processReport(
    reportId: string,
    type: ReportType,
    period: ReportPeriod,
    customDateRange?: { startDate: string; endDate: string },
  ) {
    try {
      await this.adminReportRepository.updateStatus(reportId, ReportStatus.PROCESSING);

      const { startDate, endDate } = this.getDateRange(period, customDateRange);
      let reportData: any;

      switch (type) {
        case ReportType.REVENUE:
          reportData = await this.adminReportRepository.getRevenueData(startDate, endDate);
          break;
        case ReportType.TRANSACTION:
          reportData = await this.adminReportRepository.getTransactionSummary(startDate, endDate);
          break;
        case ReportType.BUSINESS_PERFORMANCE:
          reportData = await this.adminReportRepository.getBusinessPerformance(startDate, endDate);
          break;
        case ReportType.SUBSCRIPTION_SUMMARY:
          reportData = await this.adminReportRepository.getSubscriptionSummary();
          break;
        default:
          reportData = {};
      }

      const pdfBuffer = await this.generatePDF(type, period, reportData, startDate, endDate);
      const pdfFilename = `report-${reportId}-${Date.now()}.pdf`;
      const pdfPath = path.join(process.cwd(), 'uploads', 'reports', pdfFilename);
      await fs.ensureDir(path.dirname(pdfPath));
      await fs.writeFile(pdfPath, pdfBuffer);

      const excelBuffer = await this.generateExcel(type, period, reportData, startDate, endDate);
      const excelFilename = `report-${reportId}-${Date.now()}.xlsx`;
      const excelPath = path.join(process.cwd(), 'uploads', 'reports', excelFilename);
      await fs.writeFile(excelPath, excelBuffer);

      await this.adminReportRepository.updateStatus(reportId, ReportStatus.COMPLETED, {
        fileUrl: `/uploads/reports/${pdfFilename}`,
        excelUrl: `/uploads/reports/${excelFilename}`,
        fileSize: pdfBuffer.length,
      });
    } catch (error: any) {
      console.error('Report generation failed:', error);
      await this.adminReportRepository.updateStatus(reportId, ReportStatus.FAILED, {
        errorMessage: error.message,
      });
    }
  }

  private generateTitle(type: ReportType, period: ReportPeriod): string {
    const typeLabels: Record<ReportType, string> = {
      [ReportType.REVENUE]: 'Laporan Pendapatan',
      [ReportType.TRANSACTION]: 'Laporan Transaksi',
      [ReportType.BUSINESS_PERFORMANCE]: 'Laporan Performa Bisnis',
      [ReportType.USER_ACTIVITY]: 'Laporan Aktivitas User',
      [ReportType.SUBSCRIPTION_SUMMARY]: 'Laporan Ringkasan Langganan',
    };
    const periodLabels: Record<ReportPeriod, string> = {
      [ReportPeriod.DAILY]: 'Harian',
      [ReportPeriod.WEEKLY]: 'Mingguan',
      [ReportPeriod.MONTHLY]: 'Bulanan',
      [ReportPeriod.QUARTERLY]: 'Quarterly',
      [ReportPeriod.YEARLY]: 'Tahunan',
      [ReportPeriod.CUSTOM]: 'Custom',
    };
    return `${typeLabels[type]} - ${periodLabels[period]}`;
  }

  private generateReportNumber(type: ReportType): string {
    const prefix = type.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `RPT/${prefix}/${timestamp}`;
  }

  private getDateRange(period: ReportPeriod, custom?: { startDate: string; endDate: string }) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (period === ReportPeriod.CUSTOM && custom) {
      return {
        startDate: new Date(custom.startDate),
        endDate: new Date(custom.endDate),
      };
    }

    switch (period) {
      case ReportPeriod.DAILY:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case ReportPeriod.WEEKLY:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case ReportPeriod.MONTHLY:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case ReportPeriod.QUARTERLY:
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case ReportPeriod.YEARLY:
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate, endDate };
  }

  private getPeriodLabel(period: ReportPeriod, startDate: Date, endDate: Date): string {
    const formatDate = (d: Date) => d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    
    switch (period) {
      case ReportPeriod.DAILY:
        return formatDate(startDate);
      case ReportPeriod.WEEKLY:
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
      case ReportPeriod.MONTHLY:
        return startDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      case ReportPeriod.QUARTERLY:
        return `Q${Math.ceil((startDate.getMonth() + 1) / 3)} ${startDate.getFullYear()}`;
      case ReportPeriod.YEARLY:
        return `Tahun ${startDate.getFullYear()}`;
      default:
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
  }

  private async generatePDF(type: ReportType, period: ReportPeriod, data: any, startDate: Date, endDate: Date): Promise<Buffer> {
    const title = this.generateTitle(type, period);
    const periodLabel = this.getPeriodLabel(period, startDate, endDate);
    const generatedAt = new Date().toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const reportNumber = this.generateReportNumber(type);

    let templateData: any = {
      title,
      reportNumber,
      reportType: title.split(' - ')[0],
      periodLabel,
      generatedAt,
      currentYear: new Date().getFullYear(),
      data,
      isSubscriptionSummary: type === ReportType.SUBSCRIPTION_SUMMARY,
      isTransaction: type === ReportType.TRANSACTION,
      isRevenue: type === ReportType.REVENUE,
      isBusinessPerformance: type === ReportType.BUSINESS_PERFORMANCE,
      isUserActivity: type === ReportType.USER_ACTIVITY,
    };

    if (type === ReportType.SUBSCRIPTION_SUMMARY && data?.planDistribution) {
      const total = data.planDistribution.reduce((sum: number, p: any) => sum + p.count, 0);
      templateData.data.planDistribution = data.planDistribution.map((p: any) => ({
        ...p,
        percentage: total > 0 ? Math.round((p.count / total) * 100) : 0,
      }));
    }

    if (type === ReportType.TRANSACTION && data) {
      templateData.data.successRate = data.total > 0 ? ((data.successful / data.total) * 100).toFixed(1) : '0.0';
      templateData.data.failureRate = data.total > 0 ? ((data.failed / data.total) * 100).toFixed(1) : '0.0';
    }

    try {
      return await PdfBaseService.generate({
        templateName: 'admin-report.hbs',
        data: templateData,
        landscape: false,
        format: 'A4',
        margin: { top: 14, right: 13, bottom: 14, left: 13 },
      });
    } catch (error) {
      console.error('PDF template generation failed, using fallback:', error);
      return this.generateFallbackPDF(templateData);
    }
  }

  private async generateFallbackPDF(templateData: any): Promise<Buffer> {
    const puppeteer = await import('puppeteer-core');
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    try {
      const page = await browser.newPage();
      const html = `<html><body><h1>${templateData.title}</h1><pre>${JSON.stringify(templateData.data, null, 2)}</pre></body></html>`;
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private async generateExcel(type: ReportType, period: ReportPeriod, data: any, startDate: Date, endDate: Date): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BOSS Platform';
    workbook.created = new Date();

    const title = this.generateTitle(type, period);
    const worksheet = workbook.addWorksheet(title);

    // Header styling
    const headerRow = worksheet.addRow([title]);
    headerRow.font = { bold: true, size: 14 };
    worksheet.addRow([`Periode: ${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}`]);
    worksheet.addRow([`Digenerate: ${new Date().toLocaleString('id-ID')}`]);
    worksheet.addRow([]);

    if (type === ReportType.REVENUE && data) {
      // Ringkasan section
      const summaryHeader = worksheet.addRow(['Ringkasan']);
      summaryHeader.font = { bold: true, size: 12 };
      worksheet.addRow(['Total Pendapatan', `Rp ${(data.totalRevenue || 0).toLocaleString('id-ID')}`]);
      worksheet.addRow(['Total Transaksi', data.totalTransactions || 0]);
      worksheet.addRow(['Rata-rata/Transaksi', `Rp ${Math.round(data.averagePerTransaction || 0).toLocaleString('id-ID')}`]);
      worksheet.addRow([]);

      // Breakdown Harian section
      if (data.dailyBreakdown?.length) {
        const breakdownHeader = worksheet.addRow(['Breakdown Harian']);
        breakdownHeader.font = { bold: true, size: 12 };
        
        const tableHeader = worksheet.addRow(['Tanggal', 'Pendapatan', 'Jumlah Transaksi']);
        tableHeader.eachCell((cell) => {
          cell.font = { bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        });

        data.dailyBreakdown.forEach((item: any) => {
          worksheet.addRow([
            item.date,
            `Rp ${(item.revenue || 0).toLocaleString('id-ID')}`,
            item.count || 0,
          ]);
        });
      }
    } else if (type === ReportType.BUSINESS_PERFORMANCE && data) {
      if (data.businesses?.length) {
        const tableHeader = worksheet.addRow(['No', 'Nama Bisnis', 'Owner', 'Paket', 'Pendapatan']);
        tableHeader.eachCell((cell) => {
          cell.font = { bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        });

        data.businesses.forEach((business: any, index: number) => {
          worksheet.addRow([
            index + 1,
            business.name,
            business.ownerName,
            business.plan,
            `Rp ${(business.revenue || 0).toLocaleString('id-ID')}`,
          ]);
        });
      }
    } else if (type === ReportType.TRANSACTION && data) {
      worksheet.addRow(['Metrik', 'Nilai']);
      worksheet.addRow(['Total Transaksi', data.total || 0]);
      worksheet.addRow(['Berhasil', data.successful || 0]);
      worksheet.addRow(['Gagal', data.failed || 0]);
      worksheet.addRow(['Refund', data.refunded || 0]);
      worksheet.addRow(['Success Rate', data.total ? `${((data.successful / data.total) * 100).toFixed(1)}%` : '0%']);
    } else if (type === ReportType.SUBSCRIPTION_SUMMARY && data) {
      worksheet.addRow(['Status', 'Jumlah']);
      worksheet.addRow(['Active', data.active || 0]);
      worksheet.addRow(['Trial', data.trial || 0]);
      worksheet.addRow(['Expired', data.expired || 0]);
      worksheet.addRow(['Suspended', data.suspended || 0]);
      worksheet.addRow(['Cancelled', data.cancelled || 0]);
      if (data.planDistribution?.length) {
        worksheet.addRow([]);
        worksheet.addRow(['Plan', 'Jumlah Bisnis']);
        data.planDistribution.forEach((p: any) => worksheet.addRow([p.plan, p.count]));
      }
    } else {
      worksheet.addRow(['Data tidak tersedia']);
    }

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 15;
      column.eachCell({ includeEmpty: false }, (cell) => {
        const cellLength = cell.value?.toString().length || 0;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = Math.min(maxLength + 2, 40);
    });

    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }

  async getAll(filters: AdminReportFilters) {
    return this.adminReportRepository.findAll(filters);
  }

  async getById(id: string) {
    const report = await this.adminReportRepository.findById(id);
    if (!report) this.notFound('Laporan tidak ditemukan');
    return report;
  }

  async delete(id: string, performedBy: string) {
    const report = await this.getById(id);
    
    if (report.fileUrl) {
      const filePath = path.join(process.cwd(), report.fileUrl);
      await fs.remove(filePath).catch(() => {});
    }

    if (report.excelUrl) {
      const excelPath = path.join(process.cwd(), report.excelUrl);
      await fs.remove(excelPath).catch(() => {});
    }

    await this.adminReportRepository.delete(id);

    await this.auditLogService.logAdminAction(
      performedBy,
      AuditAction.REPORT_GENERATED,
      AuditEntityType.REPORT,
      id,
      report.title,
      { action: 'delete' },
    );

    return { message: 'Laporan berhasil dihapus' };
  }
}
