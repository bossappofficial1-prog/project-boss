import express from "express";
import cors from "cors";
import "./configs/pasport"
import morgan from "morgan";
import apiRouter from "./routes";
import { config } from "./configs/config";
import { generalLimiter } from "./middlewares/rate_limit.middleware";
import logger from "./utils/logger.util";
import compression from 'compression';
import { errorHandler, notFound } from "./middlewares/error.middleware";
import helmet from 'helmet';
import path from "node:path";
import passport from "passport";

const app = express();

// Mengaktifkan trusted proxy untuk deteksi IP yang benar di belakang proxy seperti Nginx atau Ngrok
app.set('trust proxy', true);
app.use(passport.initialize())
// --- Middleware Keamanan ---
// Helmet untuk mengatur berbagai header HTTP guna melindungi aplikasi dari kerentanan web yang umum.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://cheaply-full-leech.ngrok-free.app"]
        },
    },
    // Mengizinkan iframe lintas-origin (misalnya, untuk beberapa gateway pembayaran atau embed)
    // Atur ke 'false' jika Anda ingin memblokir penyematan aplikasi Anda di origin lain
    crossOriginEmbedderPolicy: false
}));

// Konfigurasi CORS - Menangani Berbagi Sumber Daya Lintas-Origin
app.use(cors({
    // Mengatur origin secara dinamis berdasarkan lingkungan
    // Dalam production, gunakan origin yang diizinkan yang ditentukan. Dalam development, izinkan semua origin (*).
    origin: config.NODE_ENV === "production" ? config.ALLOWED_ORIGINS?.split(',') : "*",
    credentials: true, // Mengizinkan pengiriman cookie, header otorisasi, dll.
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Metode HTTP yang diizinkan
    // Mengatur header yang diizinkan secara kondisional berdasarkan lingkungan
    allowedHeaders: config.NODE_ENV === "production"
        ? ['Content-Type', 'Authorization', 'X-Requested-With']
        : ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning'],
}));

// --- Middleware Standar ---
//Rate limiting untuk melindungi dari serangan brute-force dan penyalahgunaan
app.use(generalLimiter);


// Middleware pengurai body - Mengurai payload JSON dan URL-encoded
app.use(express.json({ limit: '10mb' })); // Untuk body JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Untuk body URL-encoded

// Middleware kompresi - Mengompres body respons untuk pemuatan yang lebih cepat
app.use(compression());

// Middleware logging permintaan (Morgan)
if (config.NODE_ENV === "development") {
    app.use(morgan('dev')); // Output ringkas dengan warna berdasarkan status respons untuk development
} else {
    // Format log gabungan, dialirkan ke logger kustom untuk production
    app.use(morgan('combined', {
        stream: { write: (message: string) => logger.info(message.trim()) }
    }));
}

// Custom logger permintaan - Mencatat detail permintaan masuk (IP, user agent, dll.)
app.use((req, res, next) => {
    logger.info('Permintaan masuk', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});

// Melayani file statis dari direktori 'public'
app.use(express.static(path.join(__dirname, '../public')));

// --- Rute (Routes) ---
// Rute dasar
app.get('/', (req, res) => {
    return res.status(200).json({ message: 'Selamat datang di BOSS API v1' });
});

// Endpoint pemeriksaan kesehatan (Health check)
app.use('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server sehat',
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Rute API
app.use('/api/v1', apiRouter); // Rute API versi

// --- Middleware Penanganan Kesalahan ---
app.use(notFound); // not found handler
app.use(errorHandler); // error handler

export default app;