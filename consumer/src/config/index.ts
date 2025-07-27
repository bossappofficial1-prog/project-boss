import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = [
    'RABBITMQ_URL',
    'BACKEND_API_URL',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'MIDTRANS_SERVER_KEY',
    'MIDTRANS_CLIENT_KEY',
];

for (const key of requiredEnv) {
    if (!process.env[key]) {
        throw new Error(`FATAL ERROR: Environment variable ${key} is not defined.`);
    }
}

export const config = {
    BACKEND_API_URL: process.env.BACKEND_API_URL!,
    RABBITMQ_URL: process.env.RABBITMQ_URL!,
    NODE_ENV: process.env.NODE_ENV || 'development',
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID!,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN!,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER!,
    SMTP_HOST: process.env.SMTP_HOST!,
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    SMTP_USER: process.env.SMTP_USER!,
    SMTP_PASS: process.env.SMTP_PASS!,
    SMTP_FROM: process.env.SMTP_FROM || 'noreply@example.com',
    SERVICE_NAME: process.env.SERVICE_NAME || 'BOSS App',
    MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY!,
    MIDTRANS_IS_PRODUCTION: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    MIDTRANS_CLIENT_KEY: process.env.MIDTRANS_CLIENT_KEY!,
};
