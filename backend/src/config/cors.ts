import cors from 'cors';
import { config } from './index';

const corsOptions: cors.CorsOptions = {
    origin: config.isProduction
        ? ['https://yourdomain.com', 'https://www.yourdomain.com']
        : ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

export const corsMiddleware = cors(corsOptions);
