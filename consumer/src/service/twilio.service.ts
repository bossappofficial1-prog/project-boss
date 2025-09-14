import twilio from 'twilio';
import { config } from '../config';
import logger from '../utils/logger';

// Initialize Twilio client with error handling for invalid credentials
let client: twilio.Twilio | null = null;

try {
    if (config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN && config.TWILIO_ACCOUNT_SID !== 'test_account_sid') {
        client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
        logger.info('Twilio client initialized successfully', { component: 'TwilioService' });
    } else {
        logger.warn('Twilio credentials not configured or using test credentials, Twilio service will be disabled', { component: 'TwilioService' });
    }
} catch (error: any) {
    logger.error(`Failed to initialize Twilio client: ${error.message}`, { component: 'TwilioService' });
    client = null;
}

export class TwilioService {
    async sendWhatsAppMessage(to: string, body: string) {
        if (!client) {
            logger.warn(`Twilio client not available, skipping WhatsApp message to ${to}`, { component: 'TwilioService' });
            return;
        }

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
