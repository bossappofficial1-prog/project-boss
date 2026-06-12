import { BaseService } from './base.service';
import { AdminReportRepository, CreateAdminReportInput, AdminReportFilters } from '../repositories/admin-report.repository';
import { AuditLogService } from './audit-log.service';
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
    const title = this.generateTitle(type, ReportPeriod.MONTHLY);
    const periodLabel = `${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}`;
    const generatedAt = new Date().toLocaleString('id-ID');

    let summaryHtml = '';
    if (type === ReportType.SUBSCRIPTION_SUMMARY && data) {
      summaryHtml = `
        <div class="metrics">
          <div class="metric-card"><div class="metric-label">Active</div><div class="metric-value">${data.active || 0}</div></div>
          <div class="metric-card"><div class="metric-label">Trial</div><div class="metric-value">${data.trial || 0}</div></div>
          <div class="metric-card"><div class="metric-label">Expired</div><div class="metric-value">${data.expired || 0}</div></div>
          <div class="metric-card"><div class="metric-label">Suspended</div><div class="metric-value">${data.suspended || 0}</div></div>
          <div class="metric-card"><div class="metric-label">Cancelled</div><div class="metric-value">${data.cancelled || 0}</div></div>
        </div>
        ${data.planDistribution ? `
          <h3>Distribusi Plan</h3>
          <table><thead><tr><th>Plan</th><th>Jumlah Bisnis</th></tr></thead><tbody>
            ${data.planDistribution.map((p: any) => `<tr><td>${p.plan}</td><td>${p.count}</td></tr>`).join('')}
          </tbody></table>
        ` : ''}
      `;
    } else if (type === ReportType.TRANSACTION && data) {
      summaryHtml = `
        <div class="metrics">
          <div class="metric-card"><div class="metric-label">Total Transaksi</div><div class="metric-value">${data.total || 0}</div></div>
          <div class="metric-card"><div class="metric-label">Berhasil</div><div class="metric-value success">${data.successful || 0}</div></div>
          <div class="metric-card"><div class="metric-label">Gagal</div><div class="metric-value danger">${data.failed || 0}</div></div>
          <div class="metric-card"><div class="metric-label">Refund</div><div class="metric-value">${data.refunded || 0}</div></div>
          <div class="metric-card"><div class="metric-label">Success Rate</div><div class="metric-value">${data.total ? ((data.successful / data.total) * 100).toFixed(1) : 0}%</div></div>
        </div>
      `;
    } else {
      summaryHtml = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#1e293b;line-height:1.6}
      .header{border-bottom:3px solid #2563eb;padding-bottom:20px;margin-bottom:30px}
      h1{font-size:28px;color:#1e293b;margin-bottom:8px}
      .meta{color:#64748b;font-size:13px}.meta p{margin-bottom:4px}
      .metrics{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:30px}
      .metric-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 24px;min-width:140px}
      .metric-label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
      .metric-value{font-size:24px;font-weight:700;color:#1e293b}
      .metric-value.success{color:#16a34a}.metric-value.danger{color:#dc2626}
      h3{font-size:16px;margin-bottom:12px;color:#334155}
      table{width:100%;border-collapse:collapse;margin:12px 0 24px}
      th,td{border:1px solid #e2e8f0;padding:10px 14px;text-align:left;font-size:13px}
      th{background:#f1f5f9;font-weight:600;color:#475569}
      tr:nth-child(even){background:#f8fafc}
      pre{background:#f8fafc;padding:16px;border-radius:8px;font-size:12px;overflow-x:auto;border:1px solid #e2e8f0}
      .footer{margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px;text-align:center}
    </style></head><body>
      <div class="header">
        <h1>${title}</h1>
        <div class="meta">
          <p><strong>Periode:</strong> ${periodLabel}</p>
          <p><strong>Digenerate:</strong> ${generatedAt}</p>
        </div>
      </div>
      ${summaryHtml}
      <div class="footer"><p>Laporan ini digenerate otomatis oleh sistem BOSS Platform</p></div>
    </body></html>`;

    const puppeteer = await import('puppeteer-core');
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
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
