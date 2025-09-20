import nodemailer from 'nodemailer';
import { config } from '../config';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
    },
});

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export class EmailService {
    static async sendEmail(options: EmailOptions) {
        try {
            const info = await transporter.sendMail({
                from: `"${config.SERVICE_NAME}" <${config.SMTP_FROM}>`,
                ...options,
            });
            console.log(config.SMTP_HOST);

            logger.info(`Email sent to ${options.to}: ${info.messageId}`, { component: 'EmailService' });
            return info;
        } catch (error) {
            logger.error(`Error sending email to ${options.to}`, { component: 'EmailService', error });
            throw new Error('Failed to send email.');
        }
    }
}
