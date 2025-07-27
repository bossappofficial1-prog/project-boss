import dotenv from 'dotenv';

dotenv.config();

export const config = {
    BACKEND_API_URL: process.env.BACKEND_API_URL || 'http://backend:4444/api/v1',
    RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://localhost',
    NODE_ENV: process.env.NODE_ENV || 'development',
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
};
