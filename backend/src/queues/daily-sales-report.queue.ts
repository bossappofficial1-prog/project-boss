import { Job } from "bull";
import { BaseQueue } from "./base-queue";
import { BusinessRepository } from "../repositories/business.repository";
import { computeTotalsByFilter, computeCountsByFilter } from "../repositories/transaction.repository";
import { PdfBaseService } from "../service/pdf-base.service";
import { EmailService } from "../service/email.service";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import logger from "../utils/winston.logger";
import path from "path";
import fs from "fs-extra";
import hbs from "handlebars";


interface DailySalesReportPayload {
    triggeredAt: string;
    reportDate?: string;
}

export class DailySalesReportQueue extends BaseQueue<DailySalesReportPayload> {
    constructor() {
        super('daily-sales-report');
    }

    protected async handle(job: Job<DailySalesReportPayload>): Promise<void> {
        logger.info('📊 Mulai pengolahan laporan penjualan harian untuk seluruh owner...', {
            event: 'daily_sales_report_start',
            component: 'daily-sales-report-queue',
            triggeredAt: job.data.triggeredAt
        });

        try {
            // 1. Tentukan tanggal laporan (kemarin secara default, atau sesuai reportDate)
            const now = new Date();
            const reportDate = new Date();
            
            if (job.data.reportDate) {
                const [year, month, day] = job.data.reportDate.split('-').map(Number);
                reportDate.setFullYear(year, month - 1, day);
            } else {
                reportDate.setDate(now.getDate() - 1);
            }

            const startDate = new Date(reportDate);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(reportDate);
            endDate.setHours(23, 59, 59, 999);

            const dateStr = format(reportDate, 'dd MMMM yyyy', { locale: localeId });
            const generatedAtStr = format(new Date(), 'dd MMMM yyyy HH:mm:ss', { locale: localeId });
            const startISO = startDate.toISOString();
            const endISO = endDate.toISOString();

            // 2. Ambil semua bisnis aktif beserta owner dan outlet
            const activeBusinesses = await BusinessRepository.findAllActiveWithOwnerAndOutlets();

            logger.info(`🔍 Menemukan ${activeBusinesses.length} bisnis aktif untuk diproses.`, {
                event: 'daily_sales_report_fetching_businesses',
                count: activeBusinesses.length
            });

            for (const business of activeBusinesses) {
                if (!business.owner?.email) {
                    logger.warn(`⚠️ Bisnis ${business.name} tidak memiliki email owner. Melewati...`);
                    continue;
                }

                logger.info(`📈 Memproses laporan untuk bisnis: ${business.name} (${business.owner.email})`);

                let totalRevenue = 0;
                let totalExpense = 0;
                let totalTransactions = 0;
                const outletsData = [];

                for (const outlet of business.outlets) {
                    const filter = {
                        outletId: outlet.id,
                        userOutletIds: [outlet.id],
                        startDate: startISO,
                        endDate: endISO,
                    };

                    const [totals, counts] = await Promise.all([
                        computeTotalsByFilter(filter, ['SUCCESS', 'PROOF_SUBMITTED']),
                        computeCountsByFilter(filter)
                    ]);

                    const revenue = totals.total_revenue || 0;
                    const expense = totals.total_expense || 0;
                    const netProfit = totals.total_margin_pendapatan || 0;
                    const transactionCount = counts.transactionCount || 0;

                    totalRevenue += revenue;
                    totalExpense += expense;
                    totalTransactions += transactionCount;

                    outletsData.push({
                        name: outlet.name,
                        revenue,
                        expense,
                        netProfit,
                        isNetProfitPositive: netProfit >= 0,
                        transactionCount,
                    });
                }

                const netProfit = totalRevenue - totalExpense;
                const docNumber = `DSR/${format(reportDate, 'yyyyMMdd')}/${business.id.slice(-4).toUpperCase()}`;

                const pdfPayload = {
                    docNumber,
                    businessName: business.name,
                    ownerName: business.owner.name,
                    date: dateStr,
                    generatedAt: generatedAtStr,
                    totalRevenue,
                    totalExpense,
                    netProfit,
                    isNetProfitPositive: netProfit >= 0,
                    totalTransactions,
                    outlets: outletsData,
                };

                // 3. Generate PDF Buffer via Puppeteer
                const pdfBuffer = await PdfBaseService.generate({
                    templateName: 'daily-sales-report.hbs',
                    data: pdfPayload,
                    landscape: false, // portrait format
                    format: 'A4',
                });

                const fileName = `Laporan_Penjualan_Harian_${business.name.replace(/\s+/g, '_')}_${format(reportDate, 'yyyyMMdd')}.pdf`;

                // 4. Kirim Email dengan HBS template dan Attachment PDF resmi
                const emailTemplatePath = path.join(process.cwd(), 'templates', 'daily-sales-report-email.hbs');
                const emailTemplateHtml = await fs.readFile(emailTemplatePath, 'utf-8');
                const compiledEmailTemplate = hbs.compile(emailTemplateHtml);
                const emailHtml = compiledEmailTemplate(pdfPayload);

                await EmailService.sendEmail({
                    to: business.owner.email,
                    subject: `Laporan Penjualan Harian ${business.name} — ${dateStr}`,
                    text: `Halo ${business.owner.name},\n\nBerikut terlampir laporan penjualan harian resmi untuk ${business.name} tanggal ${dateStr}.\n\nTotal Pendapatan: Rp ${totalRevenue.toLocaleString('id-ID')}\nTotal Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}\nLaba Bersih: Rp ${netProfit.toLocaleString('id-ID')}\n\nLaporan ini dibuat otomatis oleh BOSS App. File PDF terlampir.\n\nSalam,\nBOSS App`,
                    html: emailHtml,
                    attachments: [
                        {
                            filename: fileName,
                            content: pdfBuffer.toString('base64'),
                            encoding: 'base64',
                            contentType: 'application/pdf',
                        }
                    ],
                });

                logger.info(`📧 Email laporan penjualan harian (dengan PDF) berhasil dikirim ke ${business.owner.email} (${business.name})`);
            }

            logger.info('✅ Selesai memproses laporan penjualan harian untuk seluruh owner.');
        } catch (error: any) {
            logger.error('❌ Gagal memproses laporan penjualan harian:', {
                event: 'daily_sales_report_failed',
                component: 'daily-sales-report-queue',
                error: error.message,
            });
            throw error;
        }
    }
}

export const dailySalesReportQueue = new DailySalesReportQueue();
