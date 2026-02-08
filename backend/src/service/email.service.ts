import axios from 'axios';

interface EmailAttachment {
    filename: string;
    content: string;  // base64 encoded
    encoding: 'base64';
    contentType: string;
}

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
    from?: string;
    attachments?: EmailAttachment[];
}

export class EmailService {
    private static EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:3020';

    static async sendEmail(options: EmailOptions) {
        const payload = {
            ...options,
            from: options.from || `"BOSS App" <bossapp@support.id>`,
        };

        try {
            await axios.post(`${this.EMAIL_SERVICE_URL}/send-email`, payload);
        } catch (error: any) {
            console.error('Error sending email:', error.response?.data || error.message);
            throw new Error('Failed to send email');
        }
    }
}