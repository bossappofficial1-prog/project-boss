import winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize } = winston.format;

// Format log kustom
const logFormat = printf(({ level, message, timestamp, component, event }) => {
    return `${timestamp} [${component || 'Consumer'}] ${level}: ${event ? `(${event}) ` : ''}${message}`;
});

const logger = winston.createLogger({
    level: 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        // Log ke konsol dengan format yang lebih mudah dibaca
        new winston.transports.Console({
            format: combine(
                colorize(),
                logFormat
            )
        }),
        // Simpan semua log ke file dengan rotasi harian
        new winston.transports.DailyRotateFile({
            filename: 'logs/consumer-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            level: 'info'
        }),
        // Simpan log error secara terpisah
        new winston.transports.DailyRotateFile({
            filename: 'logs/consumer-error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            level: 'error'
        })
    ],
    exitOnError: false,
});

export default logger;
