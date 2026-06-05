import { Job } from "bull";
import { BaseQueue } from "./base-queue";
import { BusinessRepository } from "../repositories/business.repository";
import { OutletRepository } from "../repositories/outlet.repository";
import { findTransactionsByFilter, computeTotalsByFilter, computeCountsByFilter } from "../repositories/transaction.repository";
import { generateTransactionReportPDF, TransactionReportData } from "../service/pdf.service";
import { EmailService } from "../service/email.service";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import logger from "../utils/pino.logger";

interface GenerateTransactionReportPayload {
    businessId: string;
    startDate: string;
    endDate: string;
    email: string;
    requestedBy: string;
}

export class GenerateTransactionReportQueue extends BaseQueue<GenerateTransactionReportPayload> {
    constructor() {
        super('generate-transaction-report');
    }

    protected async handle(job: Job<GenerateTransactionReportPayload>): Promise<void> {
        const { businessId, startDate, endDate, email, requestedBy } = job.data;

        logger.info('📄 Mulai generate e-statement transaksi', {
            event: 'report_generation_start',
            component: 'generate-transaction-report-queue',
            businessId,
            startDate,
            endDate,
            email,
        });

        try {
            // 1. Ambil data bisnis
            const business = await BusinessRepository.findById(businessId);
            if (!business) {
                throw new Error(`Business not found: ${businessId}`);
            }

            // 2. Ambil semua outlet milik bisnis
            const outlets = await OutletRepository.findByBusinessId(businessId);
            const outletIds = outlets.map((o) => o.id);

            if (outletIds.length === 0) {
                throw new Error(`Business ${businessId} tidak memiliki outlet`);
            }

            // 3. Query transaksi & totals
            const filter = {
                userOutletIds: outletIds,
                startDate,
                endDate,
            };

            const [transactions, totals, counts] = await Promise.all([
                findTransactionsByFilter(filter),
                computeTotalsByFilter(filter, ['SUCCESS', 'PROOF_SUBMITTED']),
                computeCountsByFilter(filter),
            ]);

            // 4. Hitung pending
            const pendingCount = transactions.filter((t) => t.status === 'PENDING').length;

            // 5. Format data untuk template PDF
            const periodStart = format(new Date(startDate), 'dd MMM yyyy', { locale: localeId });
            const periodEnd = format(new Date(endDate), 'dd MMM yyyy', { locale: localeId });
            const docNumber = `EST/${format(new Date(), 'yyyy/MM')}/${String(job.id).padStart(3, '0')}`;

            const reportData: TransactionReportData = {
                docNumber,
                businessName: business.name,
                businessId: business.id,
                period: `${periodStart} - ${periodEnd}`,
                totalRevenue: totals.total_revenue,
                totalTransactions: counts.transactionCount,
                pendingCount,
                generatedAt: format(new Date(), 'dd MMM yyyy HH:mm:ss', { locale: localeId }),
                transactions: transactions.map((trx, index) => ({
                    id: trx.orderId || `TRX-${String(index + 1).padStart(3, '0')}`,
                    date: format(new Date(trx.createdAt), 'dd MMM HH:mm'),
                    outletName: trx.order?.outlet?.name || '-',
                    amount: trx.amount,
                    status: trx.status,
                })),
            };

            // 6. Generate PDF
            const pdfBuffer = await generateTransactionReportPDF(reportData);

            logger.info('✅ PDF berhasil digenerate', {
                event: 'report_pdf_generated',
                component: 'generate-transaction-report-queue',
                businessId,
                totalTransactions: counts.transactionCount,
                pdfSize: `${(pdfBuffer.length / 1024).toFixed(1)} KB`,
            });

            // 7. Kirim email dengan attachment PDF
            const fileName = `E_Statement_Transaksi_${business.name.replace(/\s+/g, '_')}_${periodStart}_${periodEnd}.pdf`;

            await EmailService.sendEmail({
                to: email,
                subject: `E-Statement Transaksi ${business.name} — ${periodStart} s/d ${periodEnd}`,
                text: `Halo ${requestedBy},\n\nBerikut terlampir dokumen e-statement resmi (rekening koran) transaksi untuk ${business.name} periode ${periodStart} - ${periodEnd}.\n\nTotal Transaksi: ${counts.transactionCount}\nTotal Pendapatan: Rp ${totals.total_revenue.toLocaleString('id-ID')}\n\nE-statement ini digenerate otomatis oleh BOSS App.\n\nSalam,\nBOSS App`,
                html: `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #0f172a;">E-Statement Transaksi Resmi</h2>
                        <p>Halo <strong>${requestedBy}</strong>,</p>
                        <p>Berikut terlampir dokumen e-statement resmi (rekening koran) transaksi untuk <strong>${business.name}</strong> periode <strong>${periodStart} - ${periodEnd}</strong>.</p>
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 4px 0; color: #64748b;">Total Transaksi</td>
                                    <td style="padding: 4px 0; text-align: right; font-weight: 700;">${counts.transactionCount} Trx</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; color: #64748b;">Total Pendapatan</td>
                                    <td style="padding: 4px 0; text-align: right; font-weight: 700;">Rp ${totals.total_revenue.toLocaleString('id-ID')}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; color: #64748b;">Pending</td>
                                    <td style="padding: 4px 0; text-align: right; font-weight: 700; color: #d97706;">${pendingCount} Trx</td>
                                </tr>
                            </table>
                        </div>
                        <p style="font-size: 12px; color: #94a3b8;">E-statement ini digenerate otomatis oleh BOSS App. File PDF terlampir.</p>
                    </div>
                `,
                attachments: [
                    {
                        filename: fileName,
                        content: pdfBuffer.toString('base64'),
                        encoding: 'base64',
                        contentType: 'application/pdf',
                    },
                ],
            });

            logger.info('📧 Email e-statement berhasil dikirim', {
                event: 'report_email_sent',
                component: 'generate-transaction-report-queue',
                businessId,
                email,
            });
        } catch (error: any) {
            logger.error('❌ Gagal generate/kirim e-statement transaksi', {
                event: 'report_generation_failed',
                component: 'generate-transaction-report-queue',
                businessId,
                error: error.message,
            });
            throw error; // Re-throw agar Bull bisa retry
        }
    }
}

export const generateTransactionReportQueue = new GenerateTransactionReportQueue();