import axios from 'axios';
import { config } from '../config';
import logger from '../utils/logger';

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
    from?: string;
}

export class EmailService {
    static async sendEmail(options: EmailOptions) {
        const payload = {
            ...options,
            from: options.from || `"${config.SERVICE_NAME}" <${config.SMTP_FROM}>`,
        };

        try {
            const response = await axios.post(`${config.EMAIL_SERVICE_URL}/send-email`, payload);

            logger.info(`Email sent to ${options.to}: ${response.data.messageId}`, { component: 'EmailService' });
            return response.data;
        } catch (error: any) {
            logger.error(`Error sending email to ${options.to}`, { component: 'EmailService', error: error.response?.data || error.message });
            throw new Error('Failed to send email.');
        }
    }
}
