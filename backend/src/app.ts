import express from "express"
import helmet from "helmet"
import cors from "cors"
import cookieParser from "cookie-parser"
import { config } from "./config"
import { generalLimiter } from "./middleware/rate-limit.middleware"
import compression from "compression"
import { requestLogger } from "./middleware/logging.middleware"
import { errorHandler, notFound } from "./middleware/error.middleware"
import { App } from "./constants/app"
import apiRouter from "./routes/index.routes"
import morgan from "morgan"
import path from "path"

// Import rute promo
import promoRouter from './routes/promo.route';
// Import rute internal
import internalApiRouter from './routes/internal-api.route';

const app = express()

// Helmet untuk mengatur berbagai header HTTP guna melindungi aplikasi dari kerentanan web yang umum.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
}))

// Konfigurasi CORS - Menangani Berbagi Sumber Daya Lintas-Origin
app.use(cors({
    origin: config.NODE_ENV === "production" ? config.CLIENT_URL : "*",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Metode HTTP yang diizinkan
    allowedHeaders: config.NODE_ENV === "production"
        ? ['Content-Type', 'Authorization', 'X-Requested-With']
        : ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning'],
}))

//Rate limiting untuk melindungi dari serangan brute-force dan penyalahgunaan
app.use(generalLimiter)

// Middleware pengurai body - Mengurai payload JSON dan URL-encoded
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Middleware untuk mengurai cookie
app.use(cookieParser());

// Middleware kompresi - Mengompres body respons untuk pemuatan yang lebih cepat
app.use(compression());
app.use(requestLogger)

// Middleware logging permintaan (Morgan)
if (config.NODE_ENV === "development") {
    app.use(morgan('dev')); // Output ringkas dengan warna berdasarkan status respons untuk development
}

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get("/", (req, res) => {
    res.status(200).json({
        message: "success"
    })
})

app.use(App.API_PREFIX, apiRouter)
app.use(`${App.API_PREFIX}/promos`, promoRouter);
app.use(`${App.API_PREFIX}/internal`, internalApiRouter);

app.use(notFound)
app.use(errorHandler)

export default app