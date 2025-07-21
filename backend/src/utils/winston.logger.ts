import winston from "winston"
import { config } from "../config"
import path from "path"
import fs from "fs"
import DailyRotateFile from "winston-daily-rotate-file"

const LOG_DIR = path.join(__dirname, '../../logs')

// Buat folder logs jika belum ada
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const logger = winston.createLogger({
    level: config.isProduction ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { service: config.SERVICE },
    transports: [
        new DailyRotateFile({
            filename: path.join(LOG_DIR, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: "error",
            maxFiles: '14d',
            zippedArchive: true
        }),
        new DailyRotateFile({
            filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '10m',
            maxFiles: '14d',
            zippedArchive: true,
        }),
    ]
})

if (!config.isProduction) {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        })
    );
}

export default logger
