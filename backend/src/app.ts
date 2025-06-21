import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import morgan from "morgan"
import testRouter from "./routes/test.routes"
import apiRouter from "./routes"
import { config } from "./configs/config"
import { generalLimiter } from "./middlewares/rate_limit.middleware"
import logger from "./utils/logger.util"
import compression from 'compression'
import { notFound } from "./middlewares/error.middleware"
import helmet from 'helmet'
import setupSwagger from "./utils/swagger"

dotenv.config()

const app = express()

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false
}))

// CORS configuration
app.use(cors({
    origin: config.NODE_ENV === "production" ? config.ALLOWED_ORIGINS?.split(',') : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}))

// Rate limiting
app.use(generalLimiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

if (config.NODE_ENV === "development") {
    app.use(morgan('dev'))
} else {
    app.use(morgan('combined', {
        stream: { write: (message: string) => logger.info(message.trim()) }
    }))
}

app.use((req, res, next) => {
    logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    })
    next()
})

app.get('/', (req, res) => {
    return res.status(200).json({ message: 'Selamat datang di BOSS API v1' });
});

app.use('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
    })
})

setupSwagger(app)
app.use("/api", testRouter)
app.use('/api/v1', apiRouter)
app.use(notFound)

export default app
