import rateLimit from 'express-rate-limit';
import { config } from '../config';

// Rate limiter khusus untuk order creation
export const orderCreationLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // Maximum 5 orders per 5 minutes per IP
    message: {
        success: false,
        message: 'Terlalu banyak pesanan dalam waktu singkat. Silakan coba lagi dalam 5 menit.',
        error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use combination of IP and phone number for more accurate limiting
        const phone = req.body?.guestCustomer?.phone || '';
        return `${req.ip}-${phone}`;
    },
    skip: (req) => {
        // Skip rate limiting in development mode for testing
        return config.NODE_ENV === 'development' && req.headers['x-skip-rate-limit'] === 'true';
    }
});

// Rate limiter untuk order management (untuk OWNER)
export const orderManagementLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute  
    max: 100, // Maximum 100 requests per minute per user
    message: {
        success: false,
        message: 'Terlalu banyak request. Silakan coba lagi dalam 1 menit.',
        error: 'RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: (req) => {
        // Use user ID for authenticated requests, fallback to IP if not available
        return (req.storedUser?.id as string) || req.ip || '';
    }
});
