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

// Format untuk file log (tetap JSON)
const fileLogFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Format baru yang lebih cantik untuk konsol
const consoleLogFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(info => {
        const { timestamp, level, message, stack, ...meta } = info;

        let log = `${timestamp} ${level}: ${message}`;

        // Jika ada stack trace, tambahkan di baris baru
        if (stack) {
            log += `\n${stack}`;
        }

        // Jika ada metadata, tampilkan sebagai daftar key-value
        if (Object.keys(meta).length) {
            log += `\n${Object.entries(meta)
                .map(([key, value]) => `  • ${key}: ${value}`)
                .join('\n')}`;
        }

        return log;
    })
);

const logger = winston.createLogger({
    level: config.isProduction ? 'info' : 'debug',
    format: fileLogFormat, // Default format untuk file
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
            format: consoleLogFormat // Gunakan format baru yang cantik
        })
    );
}

export default logger
