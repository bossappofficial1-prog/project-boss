import cors from 'cors';
import { config } from './index';

const corsOptions: cors.CorsOptions = {
    origin: config.isProduction
        ? ['https://yourdomain.com', 'https://www.yourdomain.com']
        : [
            'http://localhost:3000',  // Frontend (Nuxt)
            'http://localhost:3010',  // Dashboard (Next.js)
            'http://localhost:3001',  // Frontend-customer (Next.js) - if needed
        ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

export const corsMiddleware = cors(corsOptions);
