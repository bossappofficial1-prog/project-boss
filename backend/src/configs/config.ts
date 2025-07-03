import dotenv from "dotenv"
dotenv.config()

export const config = {
    BASE_URL: process.env.BASE_URL || "http://localhost:2020",
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://192.168.221.41:3000',
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: parseInt(process.env.PORT || "2020", 10),
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
    JWT_SECRET: process.env.JWT_SECRET || "rahasia-bro",
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

    // cloudinary secret
    cloudinary: {
        CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        API_KEY: process.env.CLOUDINARY_API_KEY,
        API_SECRET: process.env.CLOUDINARY_API_SECRET
    },

    // rate limit configuration
    rate_limit: {
        WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
        MAX: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
    } as const,

    // mail configuration
    mailer: {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_SECURE: process.env.SMTP_SECURE,
        SMTP_PASS: process.env.SMTP_PASS,
        SMTP_USER: process.env.SMTP_USER
    } as const,

    // midtrans configuration
    midtrans: {
        MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY,
        MIDTRANS_CLIENT_KEY: process.env.MIDTRANS_CLIENT_KEY,
        MIDTRANS_MERCHANT_ID: process.env.MIDTRANS_MERCHANT_ID,
        IS_PRODUCTION: process.env.IS_PRODUCTION == "true" || false,
        MIDTRANS_NOTIFICATION_CALLBACK_URL: process.env.MIDTRANS_NOTIFICATION_CALLBACK_URL || "http://localhost:3000/midtrans-notification"
    } as const
} as const