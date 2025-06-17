import nodemailer from 'nodemailer'
import { config } from "@/configs/config";
import logger from '@/utils/logger.util';
import { getOtpEmailTemplate } from '@/templates/otp-email.template';

interface MailOptions {
    to: string;
    sucject: string
    html: string
}

const createTransport = async () => {
    if (config.NODE_ENV === 'development') {
        const testAccount = await nodemailer.createTestAccount()
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        })
    }

    return nodemailer.createTransport({
        host: config.mailer.SMTP_HOST,
        port: 587,
        secure: true,
        auth: {
            user: config.mailer.SMTP_USER,
            pass: config.mailer.SMTP_PASS
        }
    })
}

const sendEmail = async (mailOptions: MailOptions) => {
    try {
        const transporter = await createTransport()
        const info = await transporter.sendMail({
            from: '"BOSS App" <no-replay@bossapp.com>',
            ...mailOptions
        })
        logger.info(`Message sent: ${info.messageId}`)
        if (config.NODE_ENV === 'development') {
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
        return true
    } catch (error) {
        console.error('Error sending email:', error);
        logger.error('Error sending email')
        return false
    }
}

export const sendVerificationEmail = async (to: string, otp: string) => {
    const htmlContent = getOtpEmailTemplate(otp)

    const send = await sendEmail({
        to,
        sucject: 'Kode Verifikasi untuk Aplikasi BOSS',
        html: htmlContent
    })
    return send
}