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
import { NotificationRepository } from "../repositories/notification.repository";

interface GenerateServiceOrderNotificationPayload {
    orderId: string;
}

export class GenerateServiceOrderNotificationQueue extends BaseQueue<GenerateServiceOrderNotificationPayload> {
    constructor() {
        super('generate-service-order-notification');
    }

    protected async handle(job: Job<GenerateServiceOrderNotificationPayload>): Promise<void> {
        const { orderId } = job.data;

        logger.info('📄 Mulai generate laporan transaksi', {
            event: 'report_generation_start',
            component: 'generate-transaction-report-queue',
            orderId,
        });

        try {
            // 1. Ambil data pesanan
            const data = await NotificationRepository.getPayloadForServiceEmail(orderId);
            if (!data) {
                throw new Error(`Order not found: ${orderId}`);
            }

            // 2. Tambahkan URL Dashboard
            const reportData = {
                ...data,
                DashboardUrl: process.env.FRONTEND_URL || 'https://boss.com'
            };

            // 3. Compile HBS ke HTML untuk Body Mail
            const templatePath = require('path').join(process.cwd(), 'templates', 'order-service.hbs');
            const hbsTemplate = require('fs').readFileSync(templatePath, 'utf8');
            const compiledHtml = require('handlebars').compile(hbsTemplate)(reportData);

            logger.info('✅ PDF berhasil digenerate', {
                event: 'report_pdf_generated',
                component: 'generate-service-order-notification',
                orderId,
            });

            // 5. Kirim email
            const fileName = `Pesanan_Layanan_${data.OrderId}.pdf`;

            await EmailService.sendEmail({
                to: data.OwnerEmail,
                subject: `Pesanan Layanan Baru! - Order #${data.OrderId}`,
                html: compiledHtml,
                text: ""
            });

            logger.info('📧 Email notifikasi pesanan layanan berhasil dikirim', {
                event: 'report_email_sent',
                component: 'generate-service-order-notification',
                orderId,
                email: data.OwnerEmail,
            });
        } catch (error: any) {
            logger.error('❌ Gagal generate/kirim notifikasi pesanan layanan', {
                event: 'report_generation_failed',
                component: 'generate-service-order-notification',
                orderId,
                error: error.message,
            });
            throw error; // Re-throw agar Bull bisa retry
        }
    }
}

export const generateServiceOrderNotificationQueue = new GenerateServiceOrderNotificationQueue();