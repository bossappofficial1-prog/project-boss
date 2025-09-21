import dotenv from "dotenv"

dotenv.config()

export const config = {
    PORT: parseInt(process.env.PORT || "6789", 10),
    NODE_ENV: process.env.NODE_ENV || "development",
    CLIENT_URL: process.env.CLIENT_URL?.includes(", ")
        ? process.env.CLIENT_URL.split(", ")
        : process.env.CLIENT_URL || "http://localhost:3000",
    BASE_URL: process.env.BASE_URL || "http://localhost:6789",
    JWT_SECRET: process.env.JWT_SECRET || "rahasia-123-!@#",
    SERVICE: process.env.SERVICE_NAME || "service-1",
    isProduction: process.env.NODE_ENV !== "development",
    COOKIES_DOMAIN: process.env.COOKIES_DOMAIN || "localhost",
    // rate limit
    rateLimit: {
        WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "90000", 10),
        MAX: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
    },

    midtrans: {
        fees: 0.01,
        serverKey: process.env.MIDTRANS_SERVER_KEY!,
        clientKey: process.env.MIDTRANS_CLIENT_KEY!,
        isProduction: process.env.IS_PRODUCTION === "true",
    },

    redis: {
        url: process.env.REDIS_URL!,
    },

    emailService: {
        url: process.env.EMAIL_SERVICE_URL || "http://localhost:3000",
    },

    rabbitmq: {
        url: process.env.RABBITMQ_URL!,
    },

    smtp: {
        host: process.env.SMTP_HOST!,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
        from: process.env.SMTP_FROM!,
    },

    whatsapp: {
        apiUrl: process.env.WHATSAPP_API_URL,
        apiToken: process.env.WHATSAPP_API_TOKEN,
        enabled: process.env.WHATSAPP_ENABLED === 'true',
    },

    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
    }
} as const