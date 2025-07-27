import twilio from 'twilio';
import { config } from '../config';
import logger from '../utils/logger';

const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

export class TwilioService {
    async sendWhatsAppMessage(to: string, body: string) {
        try {
            await client.messages.create({
                from: `whatsapp:${config.TWILIO_PHONE_NUMBER}`,
                to: `whatsapp:${to}`,
                body
            });
            logger.info(`WhatsApp message sent to ${to}`, { component: 'TwilioService' });
        } catch (error: any) {
            // Log pesan error utama untuk visibilitas yang lebih baik
            logger.error(`Failed to send WhatsApp message to ${to}. Error: ${error.message}`, {
                component: 'TwilioService',
                // Log seluruh objek error sebagai JSON untuk detail lengkap
                twilioError: JSON.stringify(error, null, 2)
            });

            // Melempar error agar pemanggil (NotificationService) tahu bahwa pengiriman gagal
            // dan mekanisme retry dapat diaktifkan.
            throw error;
        }
    }
}
