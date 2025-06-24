export const config = {
    BASE_URL: process.env.BASE_URL || "http://localhost:4444",
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://192.168.221.41:3000',
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: parseInt(process.env.PORT || "2020", 10),
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
    JWT_SECRET: process.env.JWT_SECRET || "rahasia-bro",
    GOOGLE_CLIENT_ID: "",
    rate_limit: {
        WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
        MAX: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
    } as const,

    mailer: {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_SECURE: process.env.SMTP_SECURE,
        SMTP_PASS: process.env.SMTP_PASS,
        SMTP_USER: process.env.SMTP_USER
    } as const,

    midtrans: {
        MIDTRANS_SERVER_KEY: process.env.MIDTRANS_SERVER_KEY,
        MIDTRANS_CLIENT_KEY: process.env.MIDTRANS_CLIENT_KEY,
        MIDTRANS_MERCHANT_ID: process.env.MIDTRANS_MERCHANT_ID,
        IS_PRODUCTION: process.env.NODE_ENV === "production"
    } as const
} as const