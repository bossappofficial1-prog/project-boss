import { BaseService } from './base.service';
import { ReportRepository, CreateReportInput, ReportFilters } from '../repositories/report.repository';
import { AuditLogService } from './audit-log.service';
import { PdfBaseService } from './pdf-base.service';
import { ReportType, ReportPeriod, ReportStatus, AuditAction, AuditEntityType } from '@prisma/client';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs-extra';

export class ReportService extends BaseService {
  constructor(
    private reportRepository: ReportRepository,
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
    
    const report = await this.reportRepository.create({
      type,
      period,
      title,
      parameters: customDateRange,
      generatedBy,
    });

    // Process report in background
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
      await this.reportRepository.updateStatus(reportId, ReportStatus.PROCESSING);

      const { startDate, endDate } = this.getDateRange(period, customDateRange);
      let reportData: any;

      switch (type) {
        case ReportType.REVENUE:
          reportData = await this.reportRepository.getRevenueData(startDate, endDate);
          break;
        case ReportType.TRANSACTION:
          reportData = await this.reportRepository.getTransactionSummary(startDate, endDate);
          break;
        case ReportType.BUSINESS_PERFORMANCE:
          reportData = await this.reportRepository.getBusinessPerformance(startDate, endDate);
          break;
        case ReportType.SUBSCRIPTION_SUMMARY:
          reportData = await this.reportRepository.getSubscriptionSummary();
          break;
        default:
          reportData = {};
      }

      // Generate PDF
      const pdfBuffer = await this.generatePDF(type, title, reportData, startDate, endDate);
      const pdfFilename = `report-${reportId}-${Date.now()}.pdf`;
      const pdfPath = path.join(process.cwd(), 'uploads', 'reports', pdfFilename);
      await fs.ensureDir(path.dirname(pdfPath));
      await fs.writeFile(pdfPath, pdfBuffer);

      // Generate Excel
      const excelBuffer = await this.generateExcel(type, title, reportData, startDate, endDate);
      const excelFilename = `report-${reportId}-${Date.now()}.xlsx`;
      const excelPath = path.join(process.cwd(), 'uploads', 'reports', excelFilename);
      await fs.writeFile(excelPath, excelBuffer);

      await this.reportRepository.updateStatus(reportId, ReportStatus.COMPLETED, {
        fileUrl: `/uploads/reports/${pdfFilename}`,
        fileSize: pdfBuffer.length,
      });
    } catch (error: any) {
      console.error('Report generation failed:', error);
      await this.reportRepository.updateStatus(reportId, ReportStatus.FAILED, {
        errorMessage: error.message,
      });
    }
  }

  private get title(): string {
    return 'Report';
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

  private async generatePDF(type: ReportType, title: string, data: any, startDate: Date, endDate: Date): Promise<Buffer> {
    const templateName = this.getTemplateName(type);
    
    try {
      return await PdfBaseService.generate({
        templateName,
        data: {
          title,
          data,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          generatedAt: new Date().toISOString(),
        },
        landscape: true,
        format: 'A4',
        headerFooter: {
          headerLeft: 'BOSS Platform',
          headerRight: title,
          footerLeft: 'Laporan ini digenerate otomatis oleh sistem',
        },
      });
    } catch (error) {
      console.warn('PDF template not found, using fallback:', error);
      return this.generateFallbackPDF(title, data, startDate, endDate);
    }
  }

  private getTemplateName(type: ReportType): string {
    const templateMap: Record<ReportType, string> = {
      [ReportType.REVENUE]: 'admin-revenue-report.hbs',
      [ReportType.TRANSACTION]: 'admin-transaction-report.hbs',
      [ReportType.BUSINESS_PERFORMANCE]: 'admin-business-report.hbs',
      [ReportType.USER_ACTIVITY]: 'admin-user-report.hbs',
      [ReportType.SUBSCRIPTION_SUMMARY]: 'admin-subscription-report.hbs',
    };
    return templateMap[type];
  }

  private async generateFallbackPDF(title: string, data: any, startDate: Date, endDate: Date): Promise<Buffer> {
    // Simple fallback using basic HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #1e293b; font-size: 24px; }
          .meta { color: #64748b; font-size: 12px; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 12px; }
          th { background: #f8fafc; font-weight: 600; }
          .summary { background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">
          <p>Periode: ${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}</p>
          <p>Digenerate: ${new Date().toLocaleString('id-ID')}</p>
        </div>
        <div class="summary">
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>
      </body>
      </html>
    `;

    // Use PdfBaseService with inline HTML
    const hbs = await import('handlebars');
    const template = hbs.compile(html);
    const compiledHtml = template({});

    // For fallback, return a simple buffer
    return Buffer.from(compiledHtml, 'utf-8');
  }

  private async generateExcel(type: ReportType, title: string, data: any, startDate: Date, endDate: Date): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BOSS Platform';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(title);

    // Add header
    worksheet.addRow([title]);
    worksheet.addRow([`Periode: ${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}`]);
    worksheet.addRow([]);

    // Add data based on type
    if (type === ReportType.REVENUE && Array.isArray(data)) {
      worksheet.addRow(['Tanggal', 'Total Pendapatan', 'Jumlah Transaksi']);
      data.forEach((item: any) => {
        worksheet.addRow([
          new Date(item.createdAt).toLocaleDateString('id-ID'),
          item._sum?.totalAmount || 0,
          item._count?.id || 0,
        ]);
      });
    } else if (type === ReportType.TRANSACTION) {
      worksheet.addRow(['Metrik', 'Nilai']);
      worksheet.addRow(['Total Transaksi', data?.total || 0]);
      worksheet.addRow(['Berhasil', data?.successful || 0]);
      worksheet.addRow(['Gagal', data?.failed || 0]);
      worksheet.addRow(['Refund', data?.refunded || 0]);
      worksheet.addRow(['Success Rate', data?.total ? `${((data.successful / data.total) * 100).toFixed(1)}%` : '0%']);
    } else if (type === ReportType.SUBSCRIPTION_SUMMARY) {
      worksheet.addRow(['Status', 'Jumlah']);
      worksheet.addRow(['Active', data?.active || 0]);
      worksheet.addRow(['Trial', data?.trial || 0]);
      worksheet.addRow(['Expired', data?.expired || 0]);
      worksheet.addRow(['Suspended', data?.suspended || 0]);
      worksheet.addRow(['Cancelled', data?.cancelled || 0]);
      worksheet.addRow([]);
      worksheet.addRow(['Plan', 'Jumlah Bisnis']);
      data?.planDistribution?.forEach((item: any) => {
        worksheet.addRow([item.plan, item.count]);
      });
    } else {
      worksheet.addRow(['Data']);
      worksheet.addRow([JSON.stringify(data, null, 2)]);
    }

    // Style header
    worksheet.getRow(1).font = { bold: true, size: 14 };
    worksheet.getRow(2).font = { size: 10, color: { argb: '64748b' } };
    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    return workbook.xlsx.writeBuffer() as Promise<Buffer>;
  }

  async getAll(filters: ReportFilters) {
    return this.reportRepository.findAll(filters);
  }

  async getById(id: string) {
    const report = await this.reportRepository.findById(id);
    if (!report) this.notFound('Laporan tidak ditemukan');
    return report;
  }

  async delete(id: string, performedBy: string) {
    const report = await this.getById(id);
    
    // Delete file if exists
    if (report.fileUrl) {
      const filePath = path.join(process.cwd(), report.fileUrl);
      await fs.remove(filePath).catch(() => {});
    }

    await this.reportRepository.delete(id);

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
