import twilio from 'twilio';
import { twilioConfig } from '../config/twilio';
import logger from '../utils/winston.logger';

const client = twilio(twilioConfig.accountSid, twilioConfig.authToken);

export class TwilioService {
    async sendWhatsAppMessage(to: string, body: string) {
        try {
            await client.messages.create({
                from: `whatsapp:${twilioConfig.phoneNumber}`,
                to: `whatsapp:${to}`,
                body
            });
            logger.info(`WhatsApp message sent to ${to}`);
        } catch (error) {
            logger.error(`Failed to send WhatsApp message to ${to}`, error);
        }
    }
}
