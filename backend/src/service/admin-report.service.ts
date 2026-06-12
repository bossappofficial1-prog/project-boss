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

      const pdfBuffer = await this.generatePDF(type, reportData, startDate, endDate);
      const pdfFilename = `report-${reportId}-${Date.now()}.pdf`;
      const pdfPath = path.join(process.cwd(), 'uploads', 'reports', pdfFilename);
      await fs.ensureDir(path.dirname(pdfPath));
      await fs.writeFile(pdfPath, pdfBuffer);

      const excelBuffer = await this.generateExcel(type, reportData, startDate, endDate);
      const excelFilename = `report-${reportId}-${Date.now()}.xlsx`;
      const excelPath = path.join(process.cwd(), 'uploads', 'reports', excelFilename);
      await fs.writeFile(excelPath, excelBuffer);

      await this.adminReportRepository.updateStatus(reportId, ReportStatus.COMPLETED, {
        fileUrl: `/uploads/reports/${pdfFilename}`,
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

  private async generatePDF(type: ReportType, data: any, startDate: Date, endDate: Date): Promise<Buffer> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; }
          h1 { font-size: 24px; margin-bottom: 8px; }
          .meta { color: #64748b; font-size: 12px; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e2e8f0; padding: 10px 14px; text-align: left; font-size: 13px; }
          th { background: #f8fafc; font-weight: 600; }
          .summary { background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .metric { display: inline-block; margin-right: 40px; }
          .metric-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
          .metric-value { font-size: 20px; font-weight: 600; }
        </style>
      </head>
      <body>
        <h1>${this.generateTitle(type, ReportPeriod.MONTHLY)}</h1>
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
    return Buffer.from(html, 'utf-8');
  }

  private async generateExcel(type: ReportType, data: any, startDate: Date, endDate: Date): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BOSS Platform';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(this.generateTitle(type, ReportPeriod.MONTHLY));

    worksheet.addRow([this.generateTitle(type, ReportPeriod.MONTHLY)]);
    worksheet.addRow([`Periode: ${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}`]);
    worksheet.addRow([]);

    if (type === ReportType.TRANSACTION && data) {
      worksheet.addRow(['Metrik', 'Nilai']);
      worksheet.addRow(['Total Transaksi', data.total || 0]);
      worksheet.addRow(['Berhasil', data.successful || 0]);
      worksheet.addRow(['Gagal', data.failed || 0]);
      worksheet.addRow(['Refund', data.refunded || 0]);
    } else if (type === ReportType.SUBSCRIPTION_SUMMARY && data) {
      worksheet.addRow(['Status', 'Jumlah']);
      worksheet.addRow(['Active', data.active || 0]);
      worksheet.addRow(['Trial', data.trial || 0]);
      worksheet.addRow(['Expired', data.expired || 0]);
      worksheet.addRow(['Suspended', data.suspended || 0]);
    } else {
      worksheet.addRow(['Data']);
      worksheet.addRow([JSON.stringify(data, null, 2)]);
    }

    worksheet.getRow(1).font = { bold: true, size: 14 };
    worksheet.columns.forEach((column) => { column.width = 20; });

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
